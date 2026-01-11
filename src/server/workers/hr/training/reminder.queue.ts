import type { JobsOptions } from 'bullmq';
import { getTrainingReminderQueueClient as getClient } from '@/server/lib/queues/hr/training-reminder-queue';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { TrainingReminderEnvelope } from './reminder.types';

export interface TrainingReminderQueueClient {
    enqueueReminderJob(envelope: TrainingReminderEnvelope, options?: JobsOptions): Promise<void>;
}

export function getTrainingReminderQueueClient(
    options?: QueueRegistryOptions,
): TrainingReminderQueueClient {
    return getClient(options);
}
