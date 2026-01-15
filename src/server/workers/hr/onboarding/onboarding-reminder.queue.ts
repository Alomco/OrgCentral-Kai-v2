import type { JobsOptions } from 'bullmq';
import { getOnboardingReminderQueueClient as getClient } from '@/server/lib/queues/hr/onboarding-reminder-queue';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { OnboardingReminderEnvelope } from './onboarding-reminder.types';

export interface OnboardingReminderQueueClient {
    enqueueReminderJob(envelope: OnboardingReminderEnvelope, options?: JobsOptions): Promise<void>;
}

export function getOnboardingReminderQueueClient(
    options?: QueueRegistryOptions,
): OnboardingReminderQueueClient {
    return getClient(options);
}
