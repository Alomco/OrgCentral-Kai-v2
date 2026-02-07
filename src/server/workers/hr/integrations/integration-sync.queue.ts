import type { JobsOptions } from '@/server/lib/queueing/in-memory-queue';

import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';

import { HR_INTEGRATION_SYNC_JOB_NAME, type IntegrationSyncEnvelope } from './integration-sync.types';

export interface IntegrationSyncQueueClient {
    enqueueIntegrationSyncJob(envelope: IntegrationSyncEnvelope, options?: JobsOptions): Promise<void>;
}

export function getIntegrationSyncQueueClient(
    options?: QueueRegistryOptions,
): IntegrationSyncQueueClient {
    const queue = getQueue(WORKER_QUEUE_NAMES.HR_INTEGRATIONS_SYNC, options);

    return {
        async enqueueIntegrationSyncJob(envelope, jobOptions) {
            await queue.add(HR_INTEGRATION_SYNC_JOB_NAME, envelope, {
                removeOnComplete: true,
                attempts: 2,
                backoff: { type: 'exponential', delay: 1_000 },
                ...jobOptions,
            });
        },
    };
}

