import { Queue, type QueueOptions } from '@/server/lib/queueing/in-memory-queue';
import { registerQueueRuntimeCleanup } from '@/server/lib/queue-runtime-lifecycle';
import { getWorkerQueueMaxPendingJobs, isWorkerQueueName } from '@/server/lib/worker-constants';

const queueCache = new Map<string, Queue>();

export type SharedQueueOptions = QueueOptions;

export function getSharedQueue(name: string, options?: SharedQueueOptions): Queue {
    const existing = queueCache.get(name);
    if (existing) {
        return existing;
    }

    const maxPendingJobs =
        options?.maxPendingJobs ??
        (isWorkerQueueName(name) ? getWorkerQueueMaxPendingJobs(name) : undefined);
    const queue = new Queue(name, {
        ...options,
        maxPendingJobs,
    });

    queueCache.set(name, queue);
    return queue;
}

export async function shutdownSharedQueues(): Promise<void> {
    const queues = Array.from(queueCache.values());
    queueCache.clear();
    await Promise.allSettled(queues.map((queue) => queue.close()));
}

registerQueueRuntimeCleanup('shared-queues', shutdownSharedQueues);
