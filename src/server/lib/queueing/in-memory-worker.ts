import { appLogger } from '@/server/logging/structured-logger';
import { type Job, type Processor, type WorkerOptions } from './in-memory-queue.types';
import {
    getExistingQueueState,
    getQueueState,
    pruneQueueState,
    type InMemoryWorkerRuntime,
    type QueueRuntimeState,
} from './in-memory-queue.runtime';
import { clearQueuePendingOverflowAlertState } from './in-memory-queue-overflow-alert';
import { resolveBackoffDelayMs, wait } from './in-memory-queue.utils';

export class Worker<T = unknown, TResult = unknown, TName extends string = string> implements InMemoryWorkerRuntime {
    private readonly state: QueueRuntimeState;
    private readonly concurrency: number;
    private readonly localPending: Job[] = [];
    private inFlight = 0;

    public constructor(
        private readonly queueName: string,
        private readonly processor: Processor<T, TResult, TName>,
        options: WorkerOptions = {},
    ) {
        this.concurrency = this.resolveConcurrency(options.concurrency);
        this.state = getQueueState(queueName);
        this.state.workers.add(this);
        this.drainPending();
    }

    public close(): Promise<void> {
        if (this.localPending.length > 0) {
            this.state.pending.unshift(...this.localPending);
            this.localPending.length = 0;
        }
        this.state.workers.delete(this);
        pruneQueueState(this.queueName, this.state);
        if (!getExistingQueueState(this.queueName)) {
            clearQueuePendingOverflowAlertState(this.queueName);
        }
        return Promise.resolve();
    }

    public __submit(job: Job): void {
        if (this.inFlight >= this.concurrency) {
            this.localPending.push(job);
            return;
        }
        this.runJob(job as Job<T, TResult, TName>);
    }

    private runJob(job: Job<T, TResult, TName>): void {
        this.inFlight += 1;
        this.processWithRetry(job)
            .catch((error: unknown) => {
                appLogger.error('In-memory queue worker failed with unhandled error', {
                    queue: this.queueName,
                    error: error instanceof Error ? error.message : String(error),
                });
            })
            .finally(() => {
                this.inFlight = Math.max(0, this.inFlight - 1);
                const next = this.localPending.shift();
                if (next) {
                    this.runJob(next as Job<T, TResult, TName>);
                    return;
                }
                pruneQueueState(this.queueName, this.state);
            });
    }

    private drainPending(): void {
        const pending = [...this.state.pending];
        this.state.pending.length = 0;
        pending.forEach((job) => this.__submit(job));
    }

    private async processWithRetry(job: Job<T, TResult, TName>): Promise<void> {
        const attempts = Math.max(1, job.options.attempts ?? 1);
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            job.attemptsMade = attempt - 1;
            try {
                await this.processor(job);
                return;
            } catch (error) {
                if (attempt >= attempts) {
                    appLogger.error('In-memory queue worker failed', {
                        queue: this.queueName,
                        jobId: job.id,
                        jobName: job.name,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    return;
                }
                await wait(resolveBackoffDelayMs(job.options.backoff, attempt));
            }
        }
    }

    private resolveConcurrency(value?: number): number {
        if (!Number.isFinite(value) || typeof value !== 'number' || value <= 0) {
            return 1;
        }
        return Math.max(1, Math.floor(value));
    }
}
