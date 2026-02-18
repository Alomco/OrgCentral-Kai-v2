import { randomUUID } from 'node:crypto';
import type { ISecurityEventRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import type { EnhancedSecurityEvent, SecurityAuditTrail } from '@/server/types/enhanced-security-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { JsonRecord } from '@/server/types/json';
import { appLogger } from '@/server/logging/structured-logger';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { SecurityEventService, type LogSecurityEventInput } from './security-event-service';

const AUDIT_SOURCE = 'security-audit-service';
const AUDIT_RESOURCE_TYPE = 'audit_trail';

export interface SecurityAuditLoggingServiceDependencies {
  securityEventRepository: ISecurityEventRepository;
}

export interface SecurityAuditLoggingServiceOptions {
  notificationEnabled?: boolean;
}

export class SecurityAuditLoggingService extends AbstractBaseService {
  private readonly notificationEnabled: boolean;
  private readonly securityEventService: SecurityEventService;

  constructor(
    private readonly dependencies: SecurityAuditLoggingServiceDependencies,
    options: SecurityAuditLoggingServiceOptions = {},
  ) {
    super();
    this.notificationEnabled = options.notificationEnabled ?? true;
    this.securityEventService = new SecurityEventService({
      securityEventRepository: this.dependencies.securityEventRepository,
    });
  }

  async logSecurityEvent(input: LogSecurityEventInput): Promise<EnhancedSecurityEvent> {
    const createdEvent = await this.securityEventService.logSecurityEvent({
      ...input,
      auditSource: input.auditSource ?? AUDIT_SOURCE,
    });

    if (this.notificationEnabled) {
      this.logStructuredEvent(createdEvent);
    }

    return createdEvent;
  }

  async getSecurityEvent(
    context: RepositoryAuthorizationContext,
    eventId: string,
  ): Promise<EnhancedSecurityEvent | null> {
    const event = await this.dependencies.securityEventRepository.getEvent(context, eventId);
    return event?.orgId === context.orgId ? event : null;
  }

  getSecurityEventsByOrg(
    context: RepositoryAuthorizationContext,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      severity?: string;
      eventType?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<EnhancedSecurityEvent[]> {
    return this.dependencies.securityEventRepository.getEventsByOrg(context, filters);
  }

  countSecurityEventsByOrg(
    context: RepositoryAuthorizationContext,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      severity?: string;
      eventType?: string;
    },
  ): Promise<number> {
    return this.dependencies.securityEventRepository.countEventsByOrg(context, filters);
  }

  async createAuditTrailEntry(
    context: RepositoryAuthorizationContext,
    action: string,
    resourceType: string,
    resourceId?: string,
  ): Promise<SecurityAuditTrail> {
    const ipAddress = context.ipAddress ?? 'unknown';
    const userAgent = context.userAgent ?? 'unknown';
    const auditMetadata = {
      sessionId: context.sessionId ?? 'unknown',
      role: context.roleKey,
      mfaVerified: context.mfaVerified ?? false,
    } satisfies JsonRecord;

    const auditEntry: SecurityAuditTrail = {
      eventId: `audit-${String(Date.now())}-${randomUUID()}`,
      timestamp: new Date(),
      userId: context.userId,
      orgId: context.orgId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      outcome: 'success',
      severity: 'low',
      piiAccessed: context.piiAccessRequired,
      dataClassification: context.dataClassification,
      dataResidency: context.dataResidency,
      metadata: auditMetadata,
    };

    await this.logSecurityEvent({
      orgId: context.orgId,
      eventType: 'audit.trail.entry',
      severity: auditEntry.severity,
      description: `Audit trail entry: ${action} on ${resourceType}`,
      userId: context.userId,
      ipAddress,
      userAgent,
      resourceId: auditEntry.eventId,
      resourceType: AUDIT_RESOURCE_TYPE,
      piiAccessed: auditEntry.piiAccessed,
      dataClassification: auditEntry.dataClassification,
      dataResidency: auditEntry.dataResidency,
      metadata: auditMetadata,
    });

    return auditEntry;
  }

  logPiiAccess(
    context: RepositoryAuthorizationContext,
    resourceType: string,
    resourceId: string,
    description: string,
  ): Promise<EnhancedSecurityEvent> {
    return this.logSecurityEvent({
      orgId: context.orgId,
      eventType: 'pii.access',
      severity: 'high',
      description,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      resourceId,
      resourceType,
      piiAccessed: true,
      dataClassification: context.dataClassification,
      dataResidency: context.dataResidency,
      metadata: {
        sessionId: context.sessionId ?? null,
        role: context.roleKey,
        mfaVerified: context.mfaVerified ?? null,
      },
    });
  }

  logDataBreachAttempt(
    context: RepositoryAuthorizationContext,
    description: string,
    sourceIpAddress: string,
    userAgent: string,
  ): Promise<EnhancedSecurityEvent> {
    return this.logSecurityEvent({
      orgId: context.orgId,
      eventType: 'data.breach.attempt',
      severity: 'critical',
      description,
      userId: context.userId,
      ipAddress: sourceIpAddress,
      userAgent,
      piiAccessed: true,
      dataClassification: context.dataClassification,
      dataResidency: context.dataResidency,
      dataBreachPotential: true,
      remediationSteps: ['Isolate systems', 'Review access logs', 'Notify authorities if required'],
      metadata: {
        sessionId: context.sessionId ?? null,
        role: context.roleKey,
        mfaVerified: context.mfaVerified ?? null,
      },
    });
  }

  async performSecurityAudit(
    context: RepositoryAuthorizationContext,
  ): Promise<{ findings: EnhancedSecurityEvent[]; summary: Record<'critical' | 'high' | 'medium' | 'low', number> & { total: number } }> {
    const events = await this.getSecurityEventsByOrg(context, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const summary = events.reduce(
      (accumulator, event) => {
        const severity = (event.severity || 'low').toLowerCase();
        if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') {
          accumulator[severity] += 1;
        }
        accumulator.total += 1;
        return accumulator;
      },
      { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    );

    return { findings: events, summary };
  }

  private logStructuredEvent(event: EnhancedSecurityEvent): void {
    const metadata = {
      orgId: event.orgId,
      eventType: event.eventType,
      userId: event.userId,
      timestamp: event.createdAt,
      resourceId: event.resourceId,
      severity: event.severity,
      metadata: event.metadata,
    };

    if (event.severity === 'critical') {
      appLogger.error('security.event.critical', metadata);
      return;
    }
    if (event.severity === 'high') {
      appLogger.warn('security.event.high', metadata);
      return;
    }
    appLogger.info('security.event', metadata);
  }
}
