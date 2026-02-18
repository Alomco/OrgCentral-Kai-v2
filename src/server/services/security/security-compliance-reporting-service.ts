import type { ISecurityComplianceRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import type { SecurityComplianceReport, SecurityFinding } from '@/server/types/enhanced-security-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { getSecurityEventService } from './security-event-service.provider';

export interface SecurityComplianceReportingServiceDependencies {
  securityComplianceRepository: ISecurityComplianceRepository;
}

export interface GenerateComplianceReportInput {
  orgId: string;
  reportDate: Date;
  reportType: 'monthly' | 'quarterly' | 'annual' | 'ad_hoc';
}

export interface UpdateComplianceReportInput {
  orgId: string;
  reportDate: Date;
  updates: Partial<SecurityComplianceReport>;
}

export interface SecurityComplianceReportingServiceOptions {
  autoGenerateFindings?: boolean;
  notificationEnabled?: boolean;
}

export class SecurityComplianceReportingService extends AbstractBaseService {
  private readonly autoGenerateFindings: boolean;
  private readonly notificationEnabled: boolean;
  constructor(
    private readonly dependencies: SecurityComplianceReportingServiceDependencies,
    options: SecurityComplianceReportingServiceOptions = {},
  ) {
    super();
    this.autoGenerateFindings = options.autoGenerateFindings ?? true;
    this.notificationEnabled = options.notificationEnabled ?? true;
  }

  async generateComplianceReport(
    context: RepositoryAuthorizationContext,
    input: GenerateComplianceReportInput,
  ): Promise<SecurityComplianceReport> {
    this.assertOrg(context, input.orgId);

    const findings = this.autoGenerateFindings ? await this.buildFindings(context) : [];
    const complianceStatus = this.calculateComplianceStatus(findings);
    const recommendations = this.generateRecommendations(findings);
    const nextAuditDate = this.calculateNextAuditDate(input.reportType, input.reportDate);

    const report: Omit<SecurityComplianceReport, 'id'> = {
      orgId: input.orgId,
      reportDate: input.reportDate,
      complianceStatus,
      findings,
      recommendations,
      nextAuditDate,
    };

    const savedReport = await this.dependencies.securityComplianceRepository.createReport(context, report);

    if (this.notificationEnabled) {
      await this.logReportEvent(context, 'security.compliance.report.generated', savedReport, input.reportType);
    }

    return savedReport;
  }

  async getComplianceReport(
    context: RepositoryAuthorizationContext,
    reportDate: Date,
  ): Promise<SecurityComplianceReport | null> {
    const report = await this.dependencies.securityComplianceRepository.getReport(context, reportDate);
    return report?.orgId === context.orgId ? report : null;
  }

  async getLatestComplianceReport(
    context: RepositoryAuthorizationContext,
  ): Promise<SecurityComplianceReport | null> {
    const report = await this.dependencies.securityComplianceRepository.getLatestReport(context);
    return report?.orgId === context.orgId ? report : null;
  }

  async updateComplianceReport(
    context: RepositoryAuthorizationContext,
    input: UpdateComplianceReportInput,
  ): Promise<SecurityComplianceReport> {
    const existing = await this.getComplianceReport(context, input.reportDate);
    if (!existing) {
      throw new Error('Security compliance report not found');
    }

    await this.dependencies.securityComplianceRepository.updateReport(context, input.reportDate, input.updates);
    const updated = await this.getComplianceReport(context, input.reportDate);
    if (!updated) {
      throw new Error('Security compliance report failed to refresh');
    }

    if (this.notificationEnabled) {
      await this.logReportEvent(context, 'security.compliance.report.updated', updated, undefined, input.updates);
    }

    return updated;
  }

  async generateComplianceSummary(
    context: RepositoryAuthorizationContext,
  ): Promise<{
    overallStatus: 'pass' | 'warning' | 'fail';
    trend: 'improving' | 'declining' | 'stable';
    keyMetrics: {
      totalFindings: number;
      criticalFindings: number;
      highFindings: number;
      openFindings: number;
      overdueFindings: number;
    };
    upcomingObligations: string[];
  }> {
    const latestReport = await this.getLatestComplianceReport(context);
    const totalFindings = latestReport?.findings.length ?? 0;
    const criticalFindings = latestReport?.findings.filter((finding) => finding.severity === 'critical').length ?? 0;
    const highFindings = latestReport?.findings.filter((finding) => finding.severity === 'high').length ?? 0;
    const openFindings = latestReport?.findings.filter((finding) => finding.status === 'open').length ?? 0;
    const overdueFindings = latestReport?.findings.filter(
      (finding) => finding.status === 'open' && finding.remediationDueDate < new Date(),
    ).length ?? 0;

    const upcomingObligations: string[] = [];
    if (latestReport) {
      upcomingObligations.push(`Next audit due: ${latestReport.nextAuditDate.toISOString()}`);
      if (latestReport.complianceStatus !== 'pass') {
        upcomingObligations.push('Remediate outstanding compliance findings');
      }
    }

    return {
      overallStatus: latestReport?.complianceStatus ?? 'pass',
      trend: 'stable',
      keyMetrics: {
        totalFindings,
        criticalFindings,
        highFindings,
        openFindings,
        overdueFindings,
      },
      upcomingObligations,
    };
  }

  private async buildFindings(context: RepositoryAuthorizationContext): Promise<SecurityFinding[]> {
    const fetchFindings: ((contextInput: RepositoryAuthorizationContext) => Promise<SecurityFinding[]>) | undefined =
      this.dependencies.securityComplianceRepository.listFindings?.bind(this.dependencies.securityComplianceRepository);
    if (!fetchFindings) {
      return [];
    }

    const results = await fetchFindings(context);
    return Array.isArray(results) ? results : [];
  }

  private calculateComplianceStatus(findings: SecurityFinding[]): 'pass' | 'warning' | 'fail' {
    const hasCritical = findings.some((finding) => finding.severity === 'critical');
    const hasHigh = findings.some((finding) => finding.severity === 'high');
    if (hasCritical) {
      return 'fail';
    }
    if (hasHigh) {
      return 'warning';
    }
    return findings.length > 0 ? 'warning' : 'pass';
  }

  private generateRecommendations(findings: SecurityFinding[]): string[] {
    const recommendations = new Set<string>();
    for (const finding of findings) {
      if (finding.category === 'data_protection') {
        recommendations.add('Harden data loss prevention policies');
      }
      if (finding.category === 'access_control') {
        recommendations.add('Tighten access controls and review privileges');
      }
      if (finding.category === 'incident_response') {
        recommendations.add('Refresh incident response runbooks and drills');
      }
      if (finding.severity === 'critical' || finding.severity === 'high') {
        recommendations.add('Escalate remediation ownership and timelines');
      }
    }
    if (recommendations.size === 0) {
      recommendations.add('Maintain current controls and monitor for regressions');
    }
    return Array.from(recommendations);
  }

  private calculateNextAuditDate(reportType: string, currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    if (reportType === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (reportType === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (reportType === 'annual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setDate(nextDate.getDate() + 30);
    }
    return nextDate;
  }

  private async logReportEvent(
    context: RepositoryAuthorizationContext,
    eventType: string,
    report: SecurityComplianceReport,
    reportType?: string,
    updates?: Partial<SecurityComplianceReport>,
  ): Promise<void> {
    const eventService = getSecurityEventService();
    const eventName = eventType.split('.').pop() ?? eventType;
    await eventService.logSecurityEvent({
      orgId: context.orgId,
      eventType,
      severity: 'info',
      description: `Compliance report ${eventName}`,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        reportType: reportType ?? null,
        complianceStatus: report.complianceStatus,
        findingCount: report.findings.length,
        recommendationCount: report.recommendations.length,
        updates: updates
          ? {
            complianceStatus: updates.complianceStatus ?? null,
            recommendationCount: updates.recommendations?.length ?? null,
            findingCount: updates.findings?.length ?? null,
            reportDate: updates.reportDate ? updates.reportDate.toISOString() : null,
            nextAuditDate: updates.nextAuditDate ? updates.nextAuditDate.toISOString() : null,
          }
          : null,
      },
    });
  }

  private assertOrg(context: RepositoryAuthorizationContext, orgId: string): void {
    if (context.orgId !== orgId) {
      throw new Error('Operation requires matching organization context');
    }
  }
}