import type { ISecurityMetricsRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import type { SecurityMetrics } from '@/server/types/enhanced-security-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { appLogger } from '@/server/logging/structured-logger';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { getSecurityEventService } from './security-event-service.provider';
export interface SecurityMetricsServiceDependencies {
  securityMetricsRepository: ISecurityMetricsRepository;
}
export interface GenerateMetricsInput {
  orgId: string;
  periodStart: Date;
  periodEnd: Date;
}
export interface UpdateMetricsInput {
  orgId: string;
  periodStart: Date;
  periodEnd: Date;
  updates: Partial<SecurityMetrics>;
}
export interface SecurityMetricsServiceOptions {
  autoCalculateComplianceScore?: boolean;
  notificationEnabled?: boolean;
}

export class SecurityMetricsService extends AbstractBaseService {
  private readonly autoCalculateComplianceScore: boolean;
  private readonly notificationEnabled: boolean;
  constructor(
    private readonly dependencies: SecurityMetricsServiceDependencies,
    options: SecurityMetricsServiceOptions = {},
  ) {
    super();
    this.autoCalculateComplianceScore = options.autoCalculateComplianceScore ?? true;
    this.notificationEnabled = options.notificationEnabled ?? true;
  }

  async generateMetrics(
    context: RepositoryAuthorizationContext,
    input: GenerateMetricsInput,
  ): Promise<SecurityMetrics> {
    this.assertOrg(context, input.orgId);
    const baseMetrics = this.collectBaselineMetrics(context, input.periodStart, input.periodEnd);
    const metrics: Omit<SecurityMetrics, 'id'> = {
      orgId: input.orgId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      ...baseMetrics,
      complianceScore: 0,
    };

    const complianceScore = this.autoCalculateComplianceScore
      ? this.calculateComplianceScore(metrics)
      : 100;

    const metricsWithScore: Omit<SecurityMetrics, 'id'> = { ...metrics, complianceScore };

    const savedMetrics = await this.dependencies.securityMetricsRepository.createMetrics(context, metricsWithScore);

    await getSecurityEventService().logSecurityEvent({
      orgId: context.orgId,
      eventType: 'security.metrics.generated',
      severity: 'info',
      description: 'Security metrics generated',
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        complianceScore,
        periodStart: input.periodStart.toISOString(),
        periodEnd: input.periodEnd.toISOString(),
      },
    });

    if (this.notificationEnabled && complianceScore < 80) {
      await this.sendLowComplianceNotification(context, savedMetrics);
    }

    return savedMetrics;
  }

  async getMetrics(
    context: RepositoryAuthorizationContext,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SecurityMetrics | null> {
    const metrics = await this.dependencies.securityMetricsRepository.getMetrics(context, periodStart, periodEnd);
    return metrics?.orgId === context.orgId ? metrics : null;
  }

  async getLatestMetrics(context: RepositoryAuthorizationContext): Promise<SecurityMetrics | null> {
    const metrics = await this.dependencies.securityMetricsRepository.getLatestMetrics(context);
    return metrics?.orgId === context.orgId ? metrics : null;
  }

  async updateMetrics(
    context: RepositoryAuthorizationContext,
    input: UpdateMetricsInput,
  ): Promise<SecurityMetrics> {
    const existing = await this.getMetrics(context, input.periodStart, input.periodEnd);
    if (!existing) {
      throw new Error('Security metrics record not found');
    }

    await this.dependencies.securityMetricsRepository.updateMetrics(
      context,
      input.periodStart,
      input.periodEnd,
      input.updates,
    );

    const updated = await this.getMetrics(context, input.periodStart, input.periodEnd);
    if (!updated) {
      throw new Error('Security metrics failed to refresh');
    }

    await getSecurityEventService().logSecurityEvent({
      orgId: context.orgId,
      eventType: 'security.metrics.updated',
      severity: 'info',
      description: 'Security metrics updated',
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        updates: Object.keys(input.updates),
        periodStart: input.periodStart.toISOString(),
        periodEnd: input.periodEnd.toISOString(),
      },
    });

    return updated;
  }

  async generateSecurityDashboard(
    context: RepositoryAuthorizationContext,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    currentMetrics: SecurityMetrics | null;
    trend: 'improving' | 'declining' | 'stable';
    keyFindings: string[];
    recommendations: string[];
  }> {
    const currentMetrics = await this.getMetrics(context, periodStart, periodEnd);
    const duration = periodEnd.getTime() - periodStart.getTime();
    const previousEnd = new Date(periodStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    const previousMetrics = await this.getMetrics(context, previousStart, previousEnd);
    const trend: 'improving' | 'declining' | 'stable' = !currentMetrics || !previousMetrics
      ? 'stable'
      : currentMetrics.complianceScore > previousMetrics.complianceScore
        ? 'improving'
        : currentMetrics.complianceScore < previousMetrics.complianceScore
          ? 'declining'
          : 'stable';

    const keyFindings: string[] = [];
    const recommendations: string[] = [];

    if (currentMetrics?.securityEvents && currentMetrics.securityEvents > 0) {
      keyFindings.push(`${String(currentMetrics.securityEvents)} security events detected`);
    }
    if (currentMetrics?.incidents && currentMetrics.incidents > 0) {
      keyFindings.push(`${String(currentMetrics.incidents)} security incidents reported`);
    }
    if (currentMetrics?.complianceScore !== undefined && currentMetrics.complianceScore < 80) {
      keyFindings.push(`Compliance score below threshold: ${String(currentMetrics.complianceScore)}%`);
      recommendations.push('Prioritize remediation of open security incidents and alerts');
    }
    if (currentMetrics?.dlpViolations && currentMetrics.dlpViolations > 0) {
      recommendations.push('Harden DLP rules and review incident response playbooks');
    }
    if (currentMetrics?.accessViolations && currentMetrics.accessViolations > 0) {
      recommendations.push('Tighten access controls and review elevated roles');
    }

    return { currentMetrics, trend, keyFindings, recommendations };
  }

  private collectBaselineMetrics(
    context: RepositoryAuthorizationContext,
    periodStart: Date,
    periodEnd: Date,
  ): Omit<SecurityMetrics, 'id' | 'orgId' | 'periodStart' | 'periodEnd' | 'complianceScore'> {
    void context;
    void periodStart;
    void periodEnd;
    return {
      totalEvents: 0,
      securityEvents: 0,
      incidents: 0,
      alertsGenerated: 0,
      alertsResolved: 0,
      meanTimeToDetection: 0,
      meanTimeToResolution: 0,
      dlpViolations: 0,
      accessViolations: 0,
      dataBreachAttempts: 0,
      successfulPhishingSimulations: 0,
      securityTrainingCompletionRate: 100,
    };
  }

  private calculateComplianceScore(metrics: Omit<SecurityMetrics, 'id'>): number {
    const penalty =
      metrics.securityEvents * 2 +
      metrics.incidents * 5 +
      metrics.dlpViolations * 2 +
      metrics.accessViolations * 3 +
      metrics.dataBreachAttempts * 5;

    const bonus = metrics.alertsGenerated > 0
      ? Math.min((metrics.alertsResolved / metrics.alertsGenerated) * 10, 10)
      : 0;

    const rawScore = 100 - Math.min(penalty, 70) + bonus;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }
  private async sendLowComplianceNotification(
    context: RepositoryAuthorizationContext,
    metrics: SecurityMetrics,
  ): Promise<void> {
    appLogger.warn('security.compliance.notification.low-score', {
      orgId: context.orgId,
      complianceScore: metrics.complianceScore,
    });

    await getSecurityEventService().logSecurityEvent({
      orgId: context.orgId,
      eventType: 'security.compliance.notification.sent',
      severity: 'info',
      description: `Low compliance score notification sent: ${String(metrics.complianceScore)}`,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        complianceScore: metrics.complianceScore,
        periodStart: metrics.periodStart.toISOString(),
        periodEnd: metrics.periodEnd.toISOString(),
      },
    });
  }

  private assertOrg(context: RepositoryAuthorizationContext, orgId: string): void {
    if (context.orgId !== orgId) {
      throw new Error('Operation requires matching organization context');
    }
  }
}