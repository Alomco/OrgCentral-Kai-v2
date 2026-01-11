import type { JobsOptions } from 'bullmq';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import { DEFAULT_WORKER_TIMEZONE, WORKER_CACHE_SCOPES, WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { SchedulerService, type RepeatExpression } from '@/server/workers/scheduler/scheduler-service';
import {
    LEAVE_ACCRUAL_JOB_NAME,
    leaveAccrualEnvelopeSchema,
    type LeaveAccrualEnvelope,
    type LeaveAccrualPayload,
} from './accrual.types';

const DEFAULT_REPEAT: RepeatExpression = { cron: '0 2 1 * *', timezone: DEFAULT_WORKER_TIMEZONE };
const scheduler = new SchedulerService();

export interface LeaveAccrualScheduleOptions {
    repeat?: RepeatExpression;
    payloadOverrides?: Partial<LeaveAccrualPayload>;
    queueOptions?: QueueRegistryOptions;
    jobOptions?: Omit<JobsOptions, 'repeat' | 'jobId'>;
}

export async function scheduleLeaveAccrualJob(
    authorization: RepositoryAuthorizationContext,
    correlationId?: string,
    options?: LeaveAccrualScheduleOptions,
): Promise<void> {
    const envelope = buildEnvelope(authorization, correlationId, options?.payloadOverrides);
    await scheduler.upsertRecurringJob({
        queue: WORKER_QUEUE_NAMES.HR_LEAVE_ACCRUAL,
        name: LEAVE_ACCRUAL_JOB_NAME,
        jobId: buildJobId(authorization.orgId),
        payload: envelope,
        repeat: options?.repeat ?? DEFAULT_REPEAT,
        queueOptions: options?.queueOptions,
        jobOptions: options?.jobOptions,
    });
}

export async function unscheduleLeaveAccrualJob(
    orgId: string,
    options?: Pick<LeaveAccrualScheduleOptions, 'repeat' | 'queueOptions'>,
): Promise<void> {
    await scheduler.removeRecurringJob(
        WORKER_QUEUE_NAMES.HR_LEAVE_ACCRUAL,
        LEAVE_ACCRUAL_JOB_NAME,
        options?.repeat ?? DEFAULT_REPEAT,
        options?.queueOptions,
        buildJobId(orgId),
    );
}

function buildEnvelope(
    authorization: RepositoryAuthorizationContext,
    correlationId?: string,
    overrides?: Partial<LeaveAccrualPayload>,
): LeaveAccrualEnvelope {
    const payload: LeaveAccrualPayload = {
        referenceDate: overrides?.referenceDate,
        year: overrides?.year,
        employeeIds: overrides?.employeeIds,
        leaveTypes: overrides?.leaveTypes,
        dryRun: overrides?.dryRun,
    };

    const resolvedCorrelation = correlationId ?? authorization.correlationId;

    const envelope: LeaveAccrualEnvelope = {
        orgId: authorization.orgId,
        payload,
        authorization: {
            userId: authorization.userId,
            requiredPermissions: { organization: ['update'] },
            expectedClassification: authorization.dataClassification,
            expectedResidency: authorization.dataResidency,
            auditSource: 'scheduler:hr:leave:accrual',
            correlationId: resolvedCorrelation,
        },
        metadata: {
            correlationId: resolvedCorrelation,
            cacheScopes: [WORKER_CACHE_SCOPES.HR_LEAVE],
        },
    };

    return leaveAccrualEnvelopeSchema.parse(envelope);
}

function buildJobId(orgId: string): string {
    return `${WORKER_QUEUE_NAMES.HR_LEAVE_ACCRUAL}:${orgId}`;
}
