import type { Job } from './in-memory-queue.types';

export const DEFAULT_MAX_PENDING_JOBS = 1_000;

interface InMemoryQueueRuntimeState {
    queues: Map<string, QueueRuntimeState>;
}

export interface SchedulerHandle {
    timeout?: ReturnType<typeof setTimeout>;
    interval?: ReturnType<typeof setInterval>;
}

export interface InMemoryWorkerRuntime {
    __submit(job: Job): void;
}

export interface QueueRuntimeState {
    nextId: number;
    pending: Job[];
    workers: Set<InMemoryWorkerRuntime>;
    workerCursor: number;
    schedulers: Map<string, SchedulerHandle>;
    delayedJobs: Map<string, ReturnType<typeof setTimeout>>;
    maxPendingJobs: number;
}

const globalRuntime = globalThis as typeof globalThis & {
    __ORG_IN_MEMORY_QUEUE_RUNTIME__?: InMemoryQueueRuntimeState;
};

const runtimeState: InMemoryQueueRuntimeState =
    globalRuntime.__ORG_IN_MEMORY_QUEUE_RUNTIME__ ?? { queues: new Map<string, QueueRuntimeState>() };
globalRuntime.__ORG_IN_MEMORY_QUEUE_RUNTIME__ = runtimeState;

export function getQueueState(name: string, maxPendingJobs?: number): QueueRuntimeState {
    const normalizedMaxPendingJobs = normalizeMaxPendingJobs(maxPendingJobs);
    let state = runtimeState.queues.get(name);
    if (!state) {
        state = {
            nextId: 1,
            pending: [],
            workers: new Set<InMemoryWorkerRuntime>(),
            workerCursor: 0,
            schedulers: new Map<string, SchedulerHandle>(),
            delayedJobs: new Map<string, ReturnType<typeof setTimeout>>(),
            maxPendingJobs: normalizedMaxPendingJobs,
        };
        runtimeState.queues.set(name, state);
        return state;
    }

    state.maxPendingJobs = Math.max(1, Math.min(state.maxPendingJobs, normalizedMaxPendingJobs));
    return state;
}

export function getExistingQueueState(name: string): QueueRuntimeState | undefined {
    return runtimeState.queues.get(name);
}

export function removeQueueState(name: string): void {
    runtimeState.queues.delete(name);
}

export function pruneQueueState(name: string, state?: QueueRuntimeState): void {
    const current = state ?? runtimeState.queues.get(name);
    if (!current) {
        return;
    }
    const hasWork =
        current.pending.length > 0 ||
        current.workers.size > 0 ||
        current.schedulers.size > 0 ||
        current.delayedJobs.size > 0;
    if (!hasWork) {
        runtimeState.queues.delete(name);
    }
}

function normalizeMaxPendingJobs(value?: number): number {
    if (!Number.isFinite(value) || typeof value !== 'number' || value <= 0) {
        return DEFAULT_MAX_PENDING_JOBS;
    }
    return Math.max(1, Math.floor(value));
}
