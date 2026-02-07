export interface QueueRepeatOptions {
    every?: number;
    offset?: number;
    limit?: number;
    pattern?: string;
    tz?: string;
}

export interface QueueBackoffOptions {
    type?: string;
    delay?: number;
}

export interface QueueJobOptions {
    attempts?: number;
    backoff?: QueueBackoffOptions | number;
    delay?: number;
    jobId?: string | number;
    removeOnComplete?: boolean | number;
    repeat?: QueueRepeatOptions;
    [key: string]: unknown;
}

export interface QueueRuntimeOptions {
    connection?: unknown;
    defaultJobOptions?: QueueJobOptions;
    maxPendingJobs?: number;
    [key: string]: unknown;
}

export interface QueueWorkerOptions {
    connection?: unknown;
    concurrency?: number;
    [key: string]: unknown;
}
