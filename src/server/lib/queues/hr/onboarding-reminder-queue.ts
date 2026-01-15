import type { JobsOptions } from 'bullmq';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { OnboardingReminderEnvelope } from '@/server/workers/hr/onboarding/onboarding-reminder.types';

export interface OnboardingReminderQueueClient {
    enqueueReminderJob(envelope: OnboardingReminderEnvelope, options?: JobsOptions): Promise<void>;
}

export function getOnboardingReminderQueueClient(
    options?: QueueRegistryOptions,
): OnboardingReminderQueueClient {
    const queue = getQueue(WORKER_QUEUE_NAMES.HR_ONBOARDING_REMINDER, options);
    return {
        async enqueueReminderJob(envelope, jobOptions) {
            await queue.add('onboarding-reminder', envelope, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1_000 },
                ...jobOptions,
            });
        },
    };
}
