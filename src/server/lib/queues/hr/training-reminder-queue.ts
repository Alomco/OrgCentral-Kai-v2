import type { JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { TrainingReminderEnvelope } from '@/server/workers/hr/training/reminder.types';

export interface TrainingReminderQueueClient {
    enqueueReminderJob(envelope: TrainingReminderEnvelope, options?: JobsOptions): Promise<void>;
}

export function getTrainingReminderQueueClient(
    options?: QueueRegistryOptions,
): TrainingReminderQueueClient {
    const queue = getQueue(WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER, options);
    return {
        async enqueueReminderJob(envelope, jobOptions) {
            await queue.add('training-reminder', envelope, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1_000 },
                ...jobOptions,
            });
        },
    };
}
