import { appLogger } from '@/server/logging/structured-logger';
import {
    Job,
    type JobsOptions,
    type Processor,
    type QueueOptions,
    type RepeatOptions,
    type WorkerOptions,
} from './in-memory-queue.types';
import {
    clearQueuePendingOverflowAlertState,
    emitQueuePendingOverflowAlert,
} from './in-memory-queue-overflow-alert';
import {
    DEFAULT_MAX_PENDING_JOBS,
    getExistingQueueState,
    getQueueState,
    pruneQueueState,
    removeQueueState,
    type SchedulerHandle,
} from './in-memory-queue.runtime';
import { resolveIntervalMs } from './in-memory-queue.utils';
export {
    Job,
    type JobsOptions,
    type Processor,
    type QueueOptions,
    type RepeatOptions,
    type WorkerOptions,
};
export { Worker } from './in-memory-worker';

export class Queue<T = unknown, TResult = unknown, TName extends string = string> {
    public readonly opts: QueueOptions;
    public readonly name: string;
    private readonly maxPendingJobs: number;

    public constructor(name: string, options: QueueOptions = {}) {
        this.name = name;
        this.opts = options;
        this.maxPendingJobs = this.resolveMaxPendingJobs(options.maxPendingJobs);
        getQueueState(this.name, this.maxPendingJobs);
    }

    public add(name: TName, data: T, options: JobsOptions = {}): Promise<Job<T, TResult, TName>> {
        const mergedOptions = {
            ...(this.opts.defaultJobOptions ?? {}),
            ...options,
        } satisfies JobsOptions;

        const repeat = mergedOptions.repeat;
        if (repeat) {
            if (mergedOptions.jobId === undefined) {
                throw new Error(`Repeat jobs require a stable jobId for queue "${this.name}".`);
            }
            this.upsertScheduler(String(mergedOptions.jobId), name, data, mergedOptions, repeat);
            return Promise.resolve(this.createJob(name, data, mergedOptions));
        }

        const job = this.createJob(name, data, mergedOptions);
        this.enqueueJob(job, mergedOptions.delay);
        return Promise.resolve(job);
    }

    public removeJobScheduler(jobId: string): Promise<void> {
        const state = getExistingQueueState(this.name);
        if (!state) {
            return Promise.resolve();
        }
        const handle = state.schedulers.get(jobId);
        if (!handle) {
            return Promise.resolve();
        }
        if (handle.timeout) {
            clearTimeout(handle.timeout);
        }
        if (handle.interval) {
            clearInterval(handle.interval);
        }
        state.schedulers.delete(jobId);
        pruneQueueState(this.name, state);
        return Promise.resolve();
    }

    public async close(): Promise<void> {
        const state = getExistingQueueState(this.name);
        if (!state) {
            return;
        }
        const schedulerIds = Array.from(state.schedulers.keys());
        await Promise.all(schedulerIds.map((jobId) => this.removeJobScheduler(jobId)));
        for (const timeout of state.delayedJobs.values()) {
            clearTimeout(timeout);
        }
        state.delayedJobs.clear();
        state.pending.length = 0;
        state.workers.clear();
        state.workerCursor = 0;
        removeQueueState(this.name);
        clearQueuePendingOverflowAlertState(this.name);
    }

    private createJob(name: TName, data: T, options: JobsOptions): Job<T, TResult, TName> {
        const state = getQueueState(this.name, this.maxPendingJobs);
        const id = String(state.nextId++);
        return new Job<T, TResult, TName>(id, name, data, options);
    }

    private upsertScheduler(
        schedulerId: string,
        name: TName,
        data: T,
        options: JobsOptions,
        repeat: RepeatOptions,
    ): void {
        this.removeJobScheduler(schedulerId).catch(() => undefined);
        const state = getQueueState(this.name, this.maxPendingJobs);
        const intervalMs = resolveIntervalMs(repeat);
        const offsetMs = Math.max(0, repeat.offset ?? intervalMs);

        let runs = 0;
        const run = async () => {
            if (repeat.limit !== undefined && runs >= repeat.limit) {
                await this.removeJobScheduler(schedulerId);
                return;
            }
            runs += 1;
            const nextJob = this.createJob(name, data, options);
            this.enqueueJob(nextJob, options.delay);
        };

        const handle: SchedulerHandle = {};
        handle.timeout = setTimeout(() => {
            run().catch(() => undefined);
            handle.interval = setInterval(() => {
                run().catch(() => undefined);
            }, intervalMs);
        }, offsetMs);

        state.schedulers.set(schedulerId, handle);
    }

    private enqueueJob(job: Job<T, TResult, TName>, delayMs?: number): void {
        if (delayMs && delayMs > 0) {
            const state = getQueueState(this.name, this.maxPendingJobs);
            const timeout = setTimeout(() => {
                state.delayedJobs.delete(job.id);
                this.dispatch(job);
                pruneQueueState(this.name, state);
            }, delayMs);
            state.delayedJobs.set(job.id, timeout);
            return;
        }
        this.dispatch(job);
    }

    private dispatch(job: Job<T, TResult, TName>): void {
        const state = getQueueState(this.name, this.maxPendingJobs);
        const workers = Array.from(state.workers);
        if (workers.length === 0) {
            if (state.pending.length >= state.maxPendingJobs) {
                const droppedJob = state.pending.shift();
                appLogger.warn('In-memory queue pending capacity reached; dropping oldest pending job', {
                    queue: this.name,
                    droppedJobId: droppedJob?.id,
                    droppedJobName: droppedJob?.name,
                    maxPendingJobs: state.maxPendingJobs,
                });
                emitQueuePendingOverflowAlert({
                    queueName: this.name,
                    droppedJobId: droppedJob?.id,
                    droppedJobName: droppedJob?.name,
                    maxPendingJobs: state.maxPendingJobs,
                });
            }
            state.pending.push(job as Job);
            return;
        }

        const worker = workers[state.workerCursor % workers.length];
        state.workerCursor += 1;
        worker.__submit(job);
    }

    private resolveMaxPendingJobs(maxPendingJobs?: number): number {
        if (!Number.isFinite(maxPendingJobs) || typeof maxPendingJobs !== 'number' || maxPendingJobs <= 0) {
            return DEFAULT_MAX_PENDING_JOBS;
        }
        return Math.max(1, Math.floor(maxPendingJobs));
    }
}
