import type { JobsOptions } from 'bullmq';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { LeaveAccrualEnvelope } from '@/server/workers/hr/leave/accrual.types';

export interface LeaveAccrualQueueClient {
    enqueueAccrualJob(envelope: LeaveAccrualEnvelope, options?: JobsOptions): Promise<void>;
}

export function getLeaveAccrualQueueClient(options?: QueueRegistryOptions): LeaveAccrualQueueClient {
    const queue = getQueue(WORKER_QUEUE_NAMES.HR_LEAVE_ACCRUAL, options);
    return {
        async enqueueAccrualJob(envelope, jobOptions) {
            await queue.add('leave-accrual', envelope, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1_000 },
                ...jobOptions,
            });
        },
    };
}
