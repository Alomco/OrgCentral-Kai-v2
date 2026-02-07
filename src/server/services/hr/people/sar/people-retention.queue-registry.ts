import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import type { RetentionQueueClient, RetentionQueueOptions } from './people-retention.queue';
import { createRetentionQueueClient } from './people-retention.queue';

let client: RetentionQueueClient | null = null;

function resolveOptions(overrides?: RetentionQueueOptions): RetentionQueueOptions {
  return {
    queueName: overrides?.queueName ?? WORKER_QUEUE_NAMES.HR_PEOPLE_RETENTION,
    defaultJobOptions: overrides?.defaultJobOptions,
    maxPendingJobs: overrides?.maxPendingJobs,
  };
}

export function getRetentionQueueClient(
  options?: RetentionQueueOptions,
): RetentionQueueClient {
  client ??= createRetentionQueueClient(resolveOptions(options));
  return client;
}
