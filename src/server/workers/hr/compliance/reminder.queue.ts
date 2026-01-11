import type { JobsOptions } from 'bullmq';
import { getComplianceReminderQueueClient as getClient } from '@/server/lib/queues/hr/compliance-reminder-queue';
import type { QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { ComplianceReminderEnvelope } from './reminder.types';

export interface ComplianceReminderQueueClient {
    enqueueReminderJob(envelope: ComplianceReminderEnvelope, options?: JobsOptions): Promise<void>;
}

export function getComplianceReminderQueueClient(
    options?: QueueRegistryOptions,
): ComplianceReminderQueueClient {
    return getClient(options);
}
