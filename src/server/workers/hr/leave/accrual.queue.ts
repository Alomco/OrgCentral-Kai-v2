import type { JobsOptions } from 'bullmq';
import { getLeaveAccrualQueueClient as getClient } from '@/server/lib/queues/hr/leave-accrual-queue';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { LeaveAccrualEnvelope } from './accrual.types';

export interface LeaveAccrualQueueClient {
    enqueueAccrualJob(envelope: LeaveAccrualEnvelope, options?: JobsOptions): Promise<void>;
}

export function getLeaveAccrualQueueClient(
    options?: QueueRegistryOptions,
): LeaveAccrualQueueClient {
    return getClient(options);
}
