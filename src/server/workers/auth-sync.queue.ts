import type { JobsOptions, Queue } from '@/server/lib/queueing/in-memory-queue';
import { getSharedQueue } from '@/server/lib/queue';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import {
    AUTH_SYNC_JOB_NAMES,
    type AuthSyncSessionJobData,
    type AuthSyncUserJobData,
} from '@/server/workers/auth-sync.types';

export interface AuthSyncQueueClient {
    queue: Queue;
    enqueueUserSync(payload: AuthSyncUserJobData, options?: JobsOptions): Promise<void>;
    enqueueSessionSync(payload: AuthSyncSessionJobData, options?: JobsOptions): Promise<void>;
}

const DEFAULT_JOB_OPTIONS: JobsOptions = {
    removeOnComplete: true,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1_000 },
};

const AUTH_SYNC_QUEUE_NAME = WORKER_QUEUE_NAMES.AUTH_SYNC;

export function getAuthSyncQueueClient(): AuthSyncQueueClient {
    const queue = getSharedQueue(AUTH_SYNC_QUEUE_NAME, {
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });

    return {
        queue,
        async enqueueUserSync(payload, jobOptions) {
            await queue.add(AUTH_SYNC_JOB_NAMES.SYNC_USER, payload, jobOptions);
        },
        async enqueueSessionSync(payload, jobOptions) {
            await queue.add(AUTH_SYNC_JOB_NAMES.SYNC_SESSION, payload, jobOptions);
        },
    } satisfies AuthSyncQueueClient;
}

