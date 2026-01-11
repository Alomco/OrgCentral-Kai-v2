import type { JobsOptions } from 'bullmq';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { ComplianceReminderEnvelope } from '@/server/workers/hr/compliance/reminder.types';

export interface ComplianceReminderQueueClient {
    enqueueReminderJob(envelope: ComplianceReminderEnvelope, options?: JobsOptions): Promise<void>;
}

export function getComplianceReminderQueueClient(
    options?: QueueRegistryOptions,
): ComplianceReminderQueueClient {
    const queue = getQueue(WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER, options);
    return {
        async enqueueReminderJob(envelope, jobOptions) {
            await queue.add('compliance-reminder', envelope, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1_000 },
                ...jobOptions,
            });
        },
    };
}
