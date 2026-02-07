import type { JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';
import { NOTIFICATION_DISPATCH_JOB_NAME, type NotificationDispatchEnvelope } from './dispatch.types';

export interface NotificationDispatchQueueClient {
    enqueueDispatchJob(envelope: NotificationDispatchEnvelope, options?: JobsOptions): Promise<void>;
}

export function getNotificationDispatchQueueClient(
    options?: QueueRegistryOptions,
): NotificationDispatchQueueClient {
    const queue = getQueue(WORKER_QUEUE_NAMES.NOTIFICATIONS_DISPATCH, options);
    return {
        async enqueueDispatchJob(envelope, jobOptions) {
            await queue.add(NOTIFICATION_DISPATCH_JOB_NAME, envelope, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1_000 },
                ...jobOptions,
            });
        },
    };
}

