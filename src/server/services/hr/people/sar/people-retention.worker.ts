import { Worker, type WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import { getRetentionQueueClient } from './people-retention.queue-registry';
import { processNightlyRetentionSweepJob, type NightlyRetentionScheduleOptions } from './people-retention.schedule';

interface RetentionWorkerOptions {
  worker?: WorkerOptions;
  scheduleOptions?: NightlyRetentionScheduleOptions;
}

type RetentionSweepPayload = Parameters<typeof processNightlyRetentionSweepJob>[0];

export function registerRetentionSweepWorker(options?: RetentionWorkerOptions): Worker {
  const queueClient = getRetentionQueueClient(options?.scheduleOptions?.queueOptions);
  const worker = new Worker(
    queueClient.queue.name,
    async (job) => {
      if (job.name !== 'retention.sweep') {
        return;
      }
      if (!isRetentionSweepPayload(job.data)) {
        return;
      }
      await processNightlyRetentionSweepJob(job.data, options?.scheduleOptions);
    },
    {
      concurrency: options?.worker?.concurrency ?? 1,
      ...options?.worker,
    },
  );

  return worker;
}

function isRetentionSweepPayload(payload: unknown): payload is RetentionSweepPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const candidate = payload as { authorization?: unknown };
  return typeof candidate.authorization === 'object' && candidate.authorization !== null;
}
