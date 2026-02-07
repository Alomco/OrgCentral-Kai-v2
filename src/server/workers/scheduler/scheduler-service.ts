import type { JobsOptions, RepeatOptions } from '@/server/lib/queueing/in-memory-queue';
import type { WorkerQueueName } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';

type IntervalUnit = 'ms' | 's' | 'm' | 'h' | 'd';

type DurationString = `${number}${IntervalUnit}`;

export type RepeatExpression =
    | { cron: string; timezone?: string; limit?: number }
    | { every: number | DurationString; limit?: number; offset?: number };

export interface RecurringJobDefinition<TPayload> {
    queue: WorkerQueueName;
    name: string;
    jobId: string;
    payload: TPayload;
    repeat: RepeatExpression;
    queueOptions?: QueueRegistryOptions;
    jobOptions?: Omit<JobsOptions, 'repeat' | 'jobId'>;
}

export class SchedulerService {
    constructor(
        private readonly queueResolver: typeof getQueue = getQueue,
    ) { }

    async upsertRecurringJob<TPayload>(definition: RecurringJobDefinition<TPayload>): Promise<void> {
        const queue = this.queueResolver(definition.queue, definition.queueOptions);
        const repeat = this.toRepeatOptions(definition.repeat);
        await queue.add(definition.name, definition.payload, {
            jobId: definition.jobId,
            repeat,
            ...(definition.jobOptions ?? {}),
        });
    }

    async removeRecurringJob(
        queueName: WorkerQueueName,
        name: string,
        repeat: RepeatExpression,
        queueOptions?: QueueRegistryOptions,
        jobId?: string,
    ): Promise<void> {
        const queue = this.queueResolver(queueName, queueOptions);
        if (!jobId) {
            throw new Error(`Job id is required to remove recurring job "${name}".`);
        }
        await queue.removeJobScheduler(jobId);
    }

    private toRepeatOptions(repeat: RepeatExpression): RepeatOptions {
        if ('cron' in repeat) {
            return {
                pattern: repeat.cron,
                tz: repeat.timezone ?? 'UTC',
                limit: repeat.limit,
            } satisfies RepeatOptions;
        }
        const interval = this.parseEvery(repeat.every);
        return {
            every: interval,
            offset: repeat.offset,
            limit: repeat.limit,
        } satisfies RepeatOptions;
    }

    private parseEvery(value: number | DurationString): number {
        if (typeof value === 'number') {
            return value;
        }

        const match = /^(-?\d+(?:\.\d+)?)(ms|s|m|h|d)$/i.exec(value.trim());
        if (!match) {
            throw new Error(`Invalid interval value "${value}" supplied to SchedulerService.`);
        }
        const [, rawAmount, rawUnit] = match;
        const amount = Number(rawAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Interval values must be positive numbers.');
        }

        const unit = rawUnit.toLowerCase() as IntervalUnit;
        const multipliers: Record<IntervalUnit, number> = {
            ms: 1,
            s: 1_000,
            m: 60_000,
            h: 3_600_000,
            d: 86_400_000,
        };

        return Math.floor(amount * multipliers[unit]);
    }
}

