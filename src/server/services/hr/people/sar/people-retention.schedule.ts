import type { JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getRetentionQueueClient } from './people-retention.queue-registry';
import { runPeopleRetentionSweepJob } from './people-sar.jobs';
import type { PeopleSarProviderOptions } from './people-sar.provider';
import type { PeopleRetentionSchedulerDeps } from './people-retention-scheduler';

const DEFAULT_CRON = '0 2 * * *'; // 02:00 UTC nightly

export interface NightlyRetentionScheduleOptions {
  cron?: string;
  jobOptions?: Omit<JobsOptions, 'repeat'>;
  queueOptions?: PeopleSarProviderOptions['queueOptions'];
  schedulerOverrides?: Partial<PeopleRetentionSchedulerDeps>;
  providerOptions?: PeopleSarProviderOptions;
}

export async function scheduleNightlyRetentionSweep(
  authorization: RepositoryAuthorizationContext,
  correlationId?: string,
  options?: NightlyRetentionScheduleOptions,
): Promise<void> {
  const queueClient = getRetentionQueueClient(options?.queueOptions);
  await queueClient.queue.add(
    'retention.sweep',
    {
      authorization,
      correlationId,
    },
    {
      repeat: { pattern: options?.cron ?? DEFAULT_CRON },
      jobId: 'hr-people-retention-sweep',
      ...options?.jobOptions,
    },
  );
}

export async function processNightlyRetentionSweepJob(
  data: { authorization: RepositoryAuthorizationContext; correlationId?: string },
  options?: NightlyRetentionScheduleOptions,
): Promise<void> {
  await runPeopleRetentionSweepJob(
    data.authorization,
    data.correlationId,
    options?.schedulerOverrides,
    options?.providerOptions,
  );
}
