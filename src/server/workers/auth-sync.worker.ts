import { Worker, type Job, type Processor, type WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import { appLogger } from '@/server/logging/structured-logger';
import { getAuthSyncQueueClient } from '@/server/workers/auth-sync.queue';
import {
    AUTH_SYNC_JOB_NAMES,
    type AuthSyncJobName,
    type AuthSyncSessionJobData,
    type AuthSyncUserJobData,
} from '@/server/workers/auth-sync.types';
import {
    syncBetterAuthSessionToPrisma,
    syncBetterAuthUserToPrisma,
} from '@/server/lib/auth-sync';

export interface AuthSyncWorkerOptions {
    worker?: WorkerOptions;
}

type AuthSyncJobData = AuthSyncUserJobData | AuthSyncSessionJobData;
type AuthSyncWorkerJob = Job<AuthSyncJobData, void, AuthSyncJobName>;
type AuthSyncProcessor = Processor<AuthSyncJobData, void, AuthSyncJobName>;

interface AuthSyncJobDataMap {
    [AUTH_SYNC_JOB_NAMES.SYNC_USER]: AuthSyncUserJobData;
    [AUTH_SYNC_JOB_NAMES.SYNC_SESSION]: AuthSyncSessionJobData;
}

export function registerAuthSyncWorker(
    options?: AuthSyncWorkerOptions,
): Worker<AuthSyncJobData, void, AuthSyncJobName> {
    const queueClient = getAuthSyncQueueClient();

    const processor: AuthSyncProcessor = async (job) => {
        if (isAuthSyncJobOfType(job, AUTH_SYNC_JOB_NAMES.SYNC_USER)) {
            await syncBetterAuthUserToPrisma(job.data);
            return;
        }

        if (isAuthSyncJobOfType(job, AUTH_SYNC_JOB_NAMES.SYNC_SESSION)) {
            await syncBetterAuthSessionToPrisma(job.data);
            return;
        }

        handleUnsupportedJob(job);
    };

    return new Worker<AuthSyncJobData, void, AuthSyncJobName>(queueClient.queue.name, processor, {
        concurrency: options?.worker?.concurrency ?? 4,
        ...options?.worker,
    });
}

function handleUnsupportedJob(job: AuthSyncWorkerJob): never {
    const jobName = job.name;
    appLogger.warn('Auth sync worker received unsupported job', {
        jobId: job.id,
        jobName,
    });
    throw new Error(`Unsupported auth sync job: ${jobName}`);
}

function isAuthSyncJobOfType<Name extends AuthSyncJobName>(
    job: AuthSyncWorkerJob,
    expectedName: Name,
): job is Job<AuthSyncJobDataMap[Name], void, Name> {
    return job.name === expectedName;
}

