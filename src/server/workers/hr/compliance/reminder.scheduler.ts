import type { JobsOptions } from 'bullmq';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import { WORKER_CACHE_SCOPES, WORKER_QUEUE_NAMES, DEFAULT_WORKER_TIMEZONE } from '@/server/lib/worker-constants';
import { SchedulerService, type RepeatExpression } from '@/server/workers/scheduler/scheduler-service';
import {
    COMPLIANCE_REMINDER_JOB_NAME,
    complianceReminderEnvelopeSchema,
    type ComplianceReminderEnvelope,
    type ComplianceReminderPayload,
} from './reminder.types';

const DEFAULT_REPEAT: RepeatExpression = { cron: '0 1 * * *', timezone: DEFAULT_WORKER_TIMEZONE };
const scheduler = new SchedulerService();

export interface ComplianceReminderScheduleOptions {
    repeat?: RepeatExpression;
    payloadOverrides?: Partial<ComplianceReminderPayload>;
    queueOptions?: QueueRegistryOptions;
    jobOptions?: Omit<JobsOptions, 'repeat' | 'jobId'>;
}

export async function scheduleComplianceReminderJob(
    authorization: RepositoryAuthorizationContext,
    correlationId?: string,
    options?: ComplianceReminderScheduleOptions,
): Promise<void> {
    const envelope = buildEnvelope(authorization, correlationId, options?.payloadOverrides);
    await scheduler.upsertRecurringJob({
        queue: WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER,
        name: COMPLIANCE_REMINDER_JOB_NAME,
        jobId: buildJobId(authorization.orgId),
        payload: envelope,
        repeat: options?.repeat ?? DEFAULT_REPEAT,
        queueOptions: options?.queueOptions,
        jobOptions: options?.jobOptions,
    });
}

export async function unscheduleComplianceReminderJob(
    orgId: string,
    options?: Pick<ComplianceReminderScheduleOptions, 'repeat' | 'queueOptions'>,
): Promise<void> {
    await scheduler.removeRecurringJob(
        WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER,
        COMPLIANCE_REMINDER_JOB_NAME,
        options?.repeat ?? DEFAULT_REPEAT,
        options?.queueOptions,
        buildJobId(orgId),
    );
}

function buildEnvelope(
    authorization: RepositoryAuthorizationContext,
    correlationId?: string,
    overrides?: Partial<ComplianceReminderPayload>,
): ComplianceReminderEnvelope {
    const payload: ComplianceReminderPayload = {
        daysUntilExpiry: overrides?.daysUntilExpiry ?? 30,
        referenceDate: overrides?.referenceDate,
        targetUserIds: overrides?.targetUserIds,
    };

    const resolvedCorrelation = correlationId ?? authorization.correlationId;

    const envelope: ComplianceReminderEnvelope = {
        orgId: authorization.orgId,
        payload,
        authorization: {
            userId: authorization.userId,
            requiredAnyPermissions: [
                { organization: ['update'] },
                { audit: ['read'] },
            ],
            expectedClassification: authorization.dataClassification,
            expectedResidency: authorization.dataResidency,
            auditSource: 'scheduler:hr:compliance:reminder',
            correlationId: resolvedCorrelation,
        },
        metadata: {
            correlationId: resolvedCorrelation,
            cacheScopes: [WORKER_CACHE_SCOPES.HR_COMPLIANCE],
        },
    };

    return complianceReminderEnvelopeSchema.parse(envelope);
}

function buildJobId(orgId: string): string {
    return `${WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER}:${orgId}`;
}
