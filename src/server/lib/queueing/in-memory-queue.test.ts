import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appLogger } from '@/server/logging/structured-logger';
import { getSharedQueue } from '@/server/lib/queue';
import { getQueue } from '@/server/lib/queue-registry';
import { runQueueRuntimeCleanup } from '@/server/lib/queue-runtime-lifecycle';
import { WORKER_QUEUE_MAX_PENDING_JOBS, WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { Queue, Worker } from './in-memory-queue';

describe('InMemoryQueue leak protections', () => {
    afterEach(async () => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        await runQueueRuntimeCleanup();
    });

    it('bounds pending jobs when no worker is registered', async () => {
        const overflowAlertSpy = vi.spyOn(appLogger, 'error');
        const queue = new Queue<{ sequence: number }>(createQueueName('pending-cap'), {
            maxPendingJobs: 2,
        });
        await queue.add('memory-test', { sequence: 1 });
        await queue.add('memory-test', { sequence: 2 });
        await queue.add('memory-test', { sequence: 3 });

        const processed: number[] = [];
        const worker = new Worker<{ sequence: number }>(queue.name, async (job) => {
            processed.push(job.data.sequence);
        });

        await flushMicrotasks();
        expect(processed).toEqual([2, 3]);
        expect(overflowAlertSpy).toHaveBeenCalledWith(
            'queue.pending.capacity.alert',
            expect.objectContaining({
                queue: queue.name,
                maxPendingJobs: 2,
                totalDropped: 1,
            }),
        );

        await worker.close();
        await queue.close();
    });

    it('cancels delayed job timers when a queue is closed', async () => {
        vi.useFakeTimers();
        const queueName = createQueueName('delay-close');
        const queue = new Queue<{ sequence: number }>(queueName);

        await queue.add('memory-test', { sequence: 1 }, { delay: 1_000 });
        await queue.close();

        const processed: number[] = [];
        const worker = new Worker<{ sequence: number }>(queue.name, async (job) => {
            processed.push(job.data.sequence);
        });

        await vi.advanceTimersByTimeAsync(1_500);
        await flushMicrotasks();
        expect(processed).toEqual([]);

        await worker.close();
    });

    it('requires a jobId for repeat jobs instead of silently dropping them', async () => {
        const queue = new Queue<{ sequence: number }>(createQueueName('repeat-job-id-required'));
        expect(() => queue.add('memory-test', { sequence: 1 }, { repeat: { every: 1_000 } }))
            .toThrow('Repeat jobs require a stable jobId');
        await queue.close();
    });

    it('honors worker concurrency limits', async () => {
        const queueName = createQueueName('worker-concurrency');
        const queue = new Queue<{ sequence: number }>(queueName);
        let releaseFirst: () => void = () => undefined;
        const firstJobReleased = new Promise<void>((resolve) => {
            releaseFirst = resolve;
        });
        const started: number[] = [];
        const processed: number[] = [];
        const worker = new Worker<{ sequence: number }>(
            queueName,
            async (job) => {
                started.push(job.data.sequence);
                if (job.data.sequence === 1) {
                    await firstJobReleased;
                }
                processed.push(job.data.sequence);
            },
            { concurrency: 1 },
        );

        await queue.add('memory-test', { sequence: 1 });
        await queue.add('memory-test', { sequence: 2 });

        await flushMicrotasks();
        expect(started).toEqual([1]);
        releaseFirst();
        await flushMicrotasks();
        await flushMicrotasks();
        expect(started).toEqual([1, 2]);
        expect(processed).toEqual([1, 2]);

        await worker.close();
        await queue.close();
    });

    it('runs runtime cleanup handlers for shared and worker queue registries', async () => {
        vi.useFakeTimers();
        const sharedQueueName = createQueueName('shared');
        const sharedQueueBeforeCleanup = getSharedQueue(sharedQueueName);
        const workerQueueBeforeCleanup = getQueue(WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER);
        await sharedQueueBeforeCleanup.add('memory-test', { sequence: 1 }, { delay: 2_000 });

        await runQueueRuntimeCleanup();

        const sharedQueueAfterCleanup = getSharedQueue(sharedQueueName);
        const workerQueueAfterCleanup = getQueue(WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER);
        const processed: number[] = [];
        const worker = new Worker<{ sequence: number }>(sharedQueueName, async (job) => {
            processed.push(job.data.sequence);
        });

        await vi.advanceTimersByTimeAsync(2_500);
        await flushMicrotasks();

        expect(sharedQueueAfterCleanup).not.toBe(sharedQueueBeforeCleanup);
        expect(workerQueueAfterCleanup).not.toBe(workerQueueBeforeCleanup);
        expect(processed).toEqual([]);

        await worker.close();
    });

    it('applies configured maxPendingJobs defaults for critical worker queues', () => {
        const workerQueue = getQueue(WORKER_QUEUE_NAMES.NOTIFICATIONS_DISPATCH);
        const sharedWorkerQueue = getSharedQueue(WORKER_QUEUE_NAMES.AUTH_SYNC);

        expect(workerQueue.opts.maxPendingJobs).toBe(
            WORKER_QUEUE_MAX_PENDING_JOBS[WORKER_QUEUE_NAMES.NOTIFICATIONS_DISPATCH],
        );
        expect(sharedWorkerQueue.opts.maxPendingJobs).toBe(
            WORKER_QUEUE_MAX_PENDING_JOBS[WORKER_QUEUE_NAMES.AUTH_SYNC],
        );
    });

    it('prunes queue runtime state when queue.close is called', async () => {
        const queueName = createQueueName('queue-close-prune');
        const queue = new Queue<{ sequence: number }>(queueName);
        const firstJob = await queue.add('memory-test', { sequence: 1 });

        await queue.close();

        const reopenedQueue = new Queue<{ sequence: number }>(queueName);
        const secondJob = await reopenedQueue.add('memory-test', { sequence: 2 });

        expect(firstJob.id).toBe('1');
        expect(secondJob.id).toBe('1');

        await reopenedQueue.close();
    });

    it('prunes queue runtime state when the final worker closes on an idle queue', async () => {
        const queueName = createQueueName('worker-close-prune');
        const queue = new Queue<{ sequence: number }>(queueName);
        const worker = new Worker(queue.name, async () => undefined);

        const firstJob = await queue.add('memory-test', { sequence: 1 });
        await flushMicrotasks();
        await worker.close();

        const recreatedQueue = new Queue<{ sequence: number }>(queueName);
        const secondJob = await recreatedQueue.add('memory-test', { sequence: 2 });

        expect(firstJob.id).toBe('1');
        expect(secondJob.id).toBe('1');

        await recreatedQueue.close();
    });
});

function createQueueName(scope: string): string {
    return `memory-queue-${scope}-${randomUUID()}`;
}

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}
