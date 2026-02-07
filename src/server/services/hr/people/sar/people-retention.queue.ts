import { Queue, type JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import {
  getWorkerQueueMaxPendingJobs,
  WORKER_QUEUE_NAMES,
  type WorkerQueueName,
} from '@/server/lib/worker-constants';
import type { RetentionJobQueue } from './people-retention-scheduler';

export interface RetentionQueueOptions {
  queueName?: WorkerQueueName;
  defaultJobOptions?: JobsOptions;
  maxPendingJobs?: number;
}

export interface RetentionQueueClient {
  queue: Queue;
  jobQueue: RetentionJobQueue;
}

export function createRetentionQueueClient(
  options: RetentionQueueOptions = {},
): RetentionQueueClient {
  const queueName = options.queueName ?? WORKER_QUEUE_NAMES.HR_PEOPLE_RETENTION;
  const queue = new Queue(queueName, {
    defaultJobOptions: options.defaultJobOptions,
    maxPendingJobs: options.maxPendingJobs ?? getWorkerQueueMaxPendingJobs(queueName),
  });

  const jobQueue: RetentionJobQueue = {
    async enqueueProfileSoftDelete(job) {
      await queue.add('profile.softDelete', job);
    },
    async enqueueContractSoftDelete(job) {
      await queue.add('contract.softDelete', job);
    },
  };

  return { queue, jobQueue };
}

export function createRetentionQueue(options?: RetentionQueueOptions): RetentionJobQueue {
  return createRetentionQueueClient(options).jobQueue;
}
