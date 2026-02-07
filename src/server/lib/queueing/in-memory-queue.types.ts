import type {
    QueueJobOptions,
    QueueRepeatOptions,
    QueueRuntimeOptions,
    QueueWorkerOptions,
} from '@/server/types/queueing';

export type RepeatOptions = QueueRepeatOptions;
export type JobsOptions = QueueJobOptions;
export type QueueOptions = QueueRuntimeOptions;
export type WorkerOptions = QueueWorkerOptions;

export class Job<T = unknown, TResult = unknown, TName extends string = string> {
    public declare readonly __resultType: TResult;
    public attemptsMade = 0;

    public constructor(
        public readonly id: string,
        public readonly name: TName,
        public readonly data: T,
        public readonly options: JobsOptions,
    ) {}
}

export type Processor<T = unknown, TResult = unknown, TName extends string = string> = (
    job: Job<T, TResult, TName>,
) => Promise<TResult> | TResult;
