import { createHash } from 'node:crypto';
import { Queue, type JobsOptions, type QueueOptions } from 'bullmq';
import Redis, { Cluster, type RedisOptions } from 'ioredis';
import type { WorkerQueueName } from '@/server/lib/worker-constants';

const DEFAULT_REDIS_URL = process.env.BULLMQ_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
const DEFAULT_JOB_OPTIONS: JobsOptions = {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 },
};

export interface QueueRegistryOptions {
    queueName?: WorkerQueueName;
    connection?: QueueOptions['connection'] | RedisConnectionOptions;
    defaultJobOptions?: JobsOptions;
}

export interface RedisConnectionOptions extends RedisOptions {
    url?: string;
}

type RedisLikeConnection = Redis | Cluster;

const queuePool = new Map<string, Queue>();
const redisPool = new Map<string, RedisLikeConnection>();

export function getQueue(
    name: WorkerQueueName,
    options?: QueueRegistryOptions,
): Queue {
    const queueName = options?.queueName ?? name;

    const existing = queuePool.get(queueName);
    if (existing) {
        return existing;
    }

    const queue = new Queue(queueName, {
        connection: resolveConnection(options?.connection),
        defaultJobOptions: mergeJobOptions(options?.defaultJobOptions),
    });

    queuePool.set(queueName, queue);
    return queue;
}

export async function shutdownQueueRegistry(): Promise<void> {
    const connections = Array.from(redisPool.values());
    redisPool.clear();
    await Promise.allSettled(connections.map((connection) => connection.quit()));

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

function resolveConnection(
    source?: QueueRegistryOptions['connection'],
): QueueOptions['connection'] {
    if (isRedisLike(source)) {
        return source;
    }
    const options = normalizeConnectionOptions(source);
    return getRedisConnection(options);
}

function normalizeConnectionOptions(
    source?: QueueRegistryOptions['connection'],
): RedisConnectionOptions {
    if (!source) {
        return { url: DEFAULT_REDIS_URL };
    }
    return source as RedisConnectionOptions;
}

function getRedisConnection(options: RedisConnectionOptions): RedisLikeConnection {
    const key = hashConnectionOptions(options);
    const existing = redisPool.get(key);
    if (existing) {
        return existing;
    }

    const connection = createRedisClient(options);
    redisPool.set(key, connection);
    return connection;
}

function createRedisClient(options: RedisConnectionOptions): RedisLikeConnection {
    if (options.url) {
        return new Redis(options.url, { ...options });
    }
    return new Redis({ ...options });
}

function isRedisLike(
    source: QueueRegistryOptions['connection'],
): source is RedisLikeConnection {
    if (!source) {
        return false;
    }
    return source instanceof Redis || source instanceof Cluster;
}

function hashConnectionOptions(options: RedisConnectionOptions): string {
    const normalized = JSON.stringify({
        url: options.url ?? null,
        host: options.host ?? null,
        port: options.port ?? null,
        db: options.db ?? 0,
        username: options.username ?? null,
    });
    return createHash('sha1').update(normalized).digest('hex');
}
