import { Queue, type JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import { registerQueueRuntimeCleanup } from '@/server/lib/queue-runtime-lifecycle';
import {
    getWorkerQueueMaxPendingJobs,
    type WorkerQueueName,
} from '@/server/lib/worker-constants';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 },
};

export interface QueueRegistryOptions {
    queueName?: WorkerQueueName;
    defaultJobOptions?: JobsOptions;
    maxPendingJobs?: number;
}

export interface QueueRegistration<Name extends WorkerQueueName = WorkerQueueName> {
    name: Name;
    options?: QueueRegistryOptions;
}

const queuePool = new Map<WorkerQueueName, Queue>();

export function buildQueueRegistryOptions(overrides?: QueueRegistryOptions): QueueRegistryOptions {
    return {
        queueName: overrides?.queueName,
        defaultJobOptions: mergeJobOptions(overrides?.defaultJobOptions),
        maxPendingJobs: overrides?.maxPendingJobs,
    };
}

export function createQueueRegistration<Name extends WorkerQueueName>(
    name: Name,
    options?: QueueRegistryOptions,
): QueueRegistration<Name> {
    return {
        name,
        options: buildQueueRegistryOptions(options),
    };
}

export function getQueue(
    name: WorkerQueueName,
    options?: QueueRegistryOptions,
): Queue {
    const resolvedOptions = buildQueueRegistryOptions(options);
    const queueName = resolvedOptions.queueName ?? name;
    const maxPendingJobs = resolvedOptions.maxPendingJobs ?? getWorkerQueueMaxPendingJobs(queueName);

    const existing = queuePool.get(queueName);
    if (existing) {
        return existing;
    }

    const queue = new Queue(queueName, {
        defaultJobOptions: resolvedOptions.defaultJobOptions,
        maxPendingJobs,
    });

    queuePool.set(queueName, queue);
    return queue;
}

export async function shutdownQueueRegistry(): Promise<void> {
    const queues = Array.from(queuePool.values());
    queuePool.clear();
    await Promise.allSettled(queues.map((queue) => queue.close()));
}

function mergeJobOptions(overrides?: JobsOptions): JobsOptions {
    if (!overrides) {
        return { ...DEFAULT_JOB_OPTIONS };
    }
    return {
        ...DEFAULT_JOB_OPTIONS,
        ...overrides,
        backoff: overrides.backoff ?? DEFAULT_JOB_OPTIONS.backoff,
    } satisfies JobsOptions;
}

registerQueueRuntimeCleanup('worker-queue-registry', shutdownQueueRegistry);
