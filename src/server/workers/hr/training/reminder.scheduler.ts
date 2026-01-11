import type { JobsOptions } from 'bullmq';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import { WORKER_CACHE_SCOPES, WORKER_QUEUE_NAMES, DEFAULT_WORKER_TIMEZONE } from '@/server/lib/worker-constants';
import { SchedulerService, type RepeatExpression } from '@/server/workers/scheduler/scheduler-service';
import {
    TRAINING_REMINDER_JOB_NAME,
    trainingReminderEnvelopeSchema,
    type TrainingReminderEnvelope,
    type TrainingReminderPayload,
} from './reminder.types';

const DEFAULT_REPEAT: RepeatExpression = { cron: '0 2 * * *', timezone: DEFAULT_WORKER_TIMEZONE };
const scheduler = new SchedulerService();

export interface TrainingReminderScheduleOptions {
    repeat?: RepeatExpression;
    payloadOverrides?: Partial<TrainingReminderPayload>;
    queueOptions?: QueueRegistryOptions;
    jobOptions?: Omit<JobsOptions, 'repeat' | 'jobId'>;
}

export async function scheduleTrainingReminderJob(
    authorization: RepositoryAuthorizationContext,
    correlationId?: string,
    options?: TrainingReminderScheduleOptions,
): Promise<void> {
    const envelope = buildEnvelope(authorization, correlationId, options?.payloadOverrides);
    await scheduler.upsertRecurringJob({
        queue: WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER,
        name: TRAINING_REMINDER_JOB_NAME,
        jobId: buildJobId(authorization.orgId),
        payload: envelope,
        repeat: options?.repeat ?? DEFAULT_REPEAT,
        queueOptions: options?.queueOptions,
        jobOptions: options?.jobOptions,
    });
}

export async function unscheduleTrainingReminderJob(
    orgId: string,
    options?: Pick<TrainingReminderScheduleOptions, 'repeat' | 'queueOptions'>,
): Promise<void> {
    await scheduler.removeRecurringJob(
        WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER,
        TRAINING_REMINDER_JOB_NAME,
        options?.repeat ?? DEFAULT_REPEAT,
        options?.queueOptions,
        buildJobId(orgId),
    );
}

function buildEnvelope(
    authorization: RepositoryAuthorizationContext,
    correlationId?: string,
    overrides?: Partial<TrainingReminderPayload>,
): TrainingReminderEnvelope {
    const payload: TrainingReminderPayload = {
        daysUntilExpiry: overrides?.daysUntilExpiry ?? 30,
        referenceDate: overrides?.referenceDate,
        targetUserIds: overrides?.targetUserIds,
        includeOverdue: overrides?.includeOverdue ?? true,
    };

    const resolvedCorrelation = correlationId ?? authorization.correlationId;

    const envelope: TrainingReminderEnvelope = {
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
            auditSource: 'scheduler:hr:training:reminder',
            correlationId: resolvedCorrelation,
        },
        metadata: {
            correlationId: resolvedCorrelation,
            cacheScopes: [WORKER_CACHE_SCOPES.HR_TRAINING],
        },
    };

    return trainingReminderEnvelopeSchema.parse(envelope);
}

function buildJobId(orgId: string): string {
    return `${WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER}:${orgId}`;
}
