import type { IDlpPolicyRepository, IDlpScanResultRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import type { DlpFinding, DlpPolicy, DlpRule, DlpScanResult, DlpScanType } from '@/server/types/enhanced-security-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { appLogger } from '@/server/logging/structured-logger';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { getSecurityEventService } from './security-event-service.provider';
export interface DlpScanningServiceDependencies {
  dlpPolicyRepository: IDlpPolicyRepository;
  dlpScanResultRepository: IDlpScanResultRepository;
}
export interface ScanContentInput {
  orgId: string;
  content: string;
  contentType: DlpScanType;
  resourceId?: string;
  resourceType?: string;
}
export interface DlpScanningServiceOptions {
  enabled?: boolean;
  logFindings?: boolean;
  autoQuarantine?: boolean;
  notificationEnabled?: boolean;
}
type DlpAction = 'allowed' | 'blocked' | 'quarantined' | 'reported';

export class DlpScanningService extends AbstractBaseService {
  private readonly enabled: boolean;
  private readonly logFindings: boolean;
  private readonly autoQuarantine: boolean;
  private readonly notificationEnabled: boolean;
  constructor(
    private readonly dependencies: DlpScanningServiceDependencies,
    options: DlpScanningServiceOptions = {},
  ) {
    super();
    this.enabled = options.enabled ?? true;
    this.logFindings = options.logFindings ?? true;
    this.autoQuarantine = options.autoQuarantine ?? false;
    this.notificationEnabled = options.notificationEnabled ?? true;
  }

  async scanContent(
    context: RepositoryAuthorizationContext,
    input: ScanContentInput,
  ): Promise<DlpScanResult> {
    this.assertOrg(context, input.orgId);

    if (!this.enabled) {
      return this.buildDisabledResult(context, input);
    }

    const policies = await this.dependencies.dlpPolicyRepository.getActivePoliciesByOrg(context);
    const findings = this.collectFindings(policies, input.content);
    const actionTaken = this.resolveAction(findings, policies);

    const scanResult: Omit<DlpScanResult, 'id'> = {
      orgId: input.orgId,
      scanType: input.contentType,
      resourceId: input.resourceId ?? 'unknown',
      resourceType: input.resourceType ?? 'unknown',
      findings,
      actionTaken,
      scannedAt: new Date(),
      scannerUserId: context.userId,
    };

    if (!this.logFindings && findings.length === 0) {
      return { ...scanResult, id: 'temporary-result' };
    }

    const savedResult = await this.dependencies.dlpScanResultRepository.createScanResult(context, scanResult);

    await getSecurityEventService().logSecurityEvent({
      orgId: context.orgId,
      eventType: 'dlp.scan.completed',
      severity: findings.length > 0 ? 'high' : 'low',
      description: `DLP scan completed: ${String(findings.length)} findings`,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      resourceId: input.resourceId,
      metadata: {
        scanType: input.contentType,
        actionTaken,
        findingCount: findings.length,
        policyCount: policies.length,
      },
    });

    if (this.notificationEnabled && findings.length > 0) {
      await this.sendDlpNotification(context, savedResult);
    }

    return savedResult;
  }

  async getScanResult(
    context: RepositoryAuthorizationContext,
    scanResultId: string,
  ): Promise<DlpScanResult | null> {
    const result = await this.dependencies.dlpScanResultRepository.getScanResult(context, scanResultId);
    return result?.orgId === context.orgId ? result : null;
  }

  async getScanResultsByOrg(
    context: RepositoryAuthorizationContext,
    filters?: {
      scanType?: string;
      startDate?: Date;
      endDate?: Date;
      actionTaken?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<DlpScanResult[]> {
    return this.dependencies.dlpScanResultRepository.getScanResultsByOrg(context, filters);
  }

  async countScanResultsByOrg(
    context: RepositoryAuthorizationContext,
    filters?: {
      scanType?: string;
      startDate?: Date;
      endDate?: Date;
      actionTaken?: string;
    },
  ): Promise<number> {
    return this.dependencies.dlpScanResultRepository.countScanResultsByOrg(context, filters);
  }

  async getActivePolicies(context: RepositoryAuthorizationContext): Promise<DlpPolicy[]> {
    return this.dependencies.dlpPolicyRepository.getActivePoliciesByOrg(context);
  }
  quickScan(content: string): Promise<{ hasPii: boolean; piiTypes: string[] }> {
    if (!this.enabled) {
      return Promise.resolve({ hasPii: false, piiTypes: [] });
    }
    const piiTypes: string[] = [];
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/u.test(content)) {
      piiTypes.push('email');
    }
    if (/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/u.test(content)) {
      piiTypes.push('phone');
    }
    if (/\b\d{3}-\d{2}-\d{4}\b/u.test(content)) {
      piiTypes.push('ssn');
    }
    return Promise.resolve({ hasPii: piiTypes.length > 0, piiTypes: Array.from(new Set(piiTypes)) });
  }

  private buildDisabledResult(context: RepositoryAuthorizationContext, input: ScanContentInput): DlpScanResult {
    return {
      id: 'dlp-scan-disabled',
      orgId: input.orgId,
      scanType: input.contentType,
      resourceId: input.resourceId ?? 'unknown',
      resourceType: input.resourceType ?? 'unknown',
      findings: [],
      actionTaken: 'allowed',
      scannedAt: new Date(),
      scannerUserId: context.userId,
    };
  }
  private collectFindings(policies: DlpPolicy[], content: string): DlpFinding[] {
    return policies.flatMap((policy) => policy.rules.flatMap((rule) => this.matchRule(content, rule)));
  }
  private resolveAction(findings: DlpFinding[], policies: DlpPolicy[]): DlpAction {
    if (findings.length === 0) {
      return 'allowed';
    }
    const actions = new Set(
      policies.flatMap((policy) => policy.rules.map((rule) => rule.action)),
    );

    if (actions.has('block')) {
      return 'blocked';
    }
    if (this.autoQuarantine || actions.has('quarantine')) {
      return 'quarantined';
    }
    if (actions.has('alert')) {
      return 'reported';
    }
    return 'allowed';
  }
  private matchRule(content: string, rule: DlpRule): DlpFinding[] {
    const regex = new RegExp(rule.pattern, 'giu');
    const findings: DlpFinding[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(content.length, match.index + match[0].length + 20);
      const context = content.slice(start, end);

      findings.push({
        id: `finding-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`,
        dataType: rule.dataType,
        confidence: 95,
        location: `position_${String(match.index)}_to_${String(match.index + match[0].length)}`,
        context,
        remediation: this.resolveRemediation(rule.action),
      });
    }

    return findings;
  }

  private resolveRemediation(action: DlpRule['action']): DlpFinding['remediation'] {
    const mapping: Record<string, DlpFinding['remediation']> = {
      block: 'blocked',
      quarantine: 'quarantined',
      alert: 'flagged',
    };
    return mapping[action] ?? 'reported';
  }

  private async sendDlpNotification(
    context: RepositoryAuthorizationContext,
    scanResult: DlpScanResult,
  ): Promise<void> {
    appLogger.warn('security.dlp.notification', {
      orgId: context.orgId,
      findingCount: scanResult.findings.length,
      scanType: scanResult.scanType,
    });

    await getSecurityEventService().logSecurityEvent({
      orgId: context.orgId,
      eventType: 'dlp.notification.sent',
      severity: 'low',
      description: `DLP notification sent for ${String(scanResult.findings.length)} findings`,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      resourceId: scanResult.resourceId,
      metadata: {
        scanType: scanResult.scanType,
        findingCount: scanResult.findings.length,
        actionTaken: scanResult.actionTaken,
      },
    });
  }

  private assertOrg(context: RepositoryAuthorizationContext, orgId: string): void {
    if (context.orgId !== orgId) {
      throw new Error('Operation requires matching organization context');
    }
  }
}