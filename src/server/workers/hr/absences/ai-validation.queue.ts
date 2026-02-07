import type { JobsOptions, Queue } from '@/server/lib/queueing/in-memory-queue';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';
import type { AbsenceAiValidationJob } from './ai-validation.types';

export const AI_VALIDATION_JOB_NAME = 'hr.absence.ai.validate';

export type AbsenceAiQueueOptions = QueueRegistryOptions;

export interface AbsenceAiQueueClient {
    queue: Queue;
    enqueueValidation: (payload: AbsenceAiValidationJob, options?: JobsOptions) => Promise<void>;
}

export function createAbsenceAiQueueClient(options: AbsenceAiQueueOptions = {}): AbsenceAiQueueClient {
    const resolved = resolveOptions(options);
    const queueName = resolved.queueName ?? WORKER_QUEUE_NAMES.HR_ABSENCE_AI_VALIDATION;
    const queue = getQueue(queueName, resolved);

    return {
        queue,
        async enqueueValidation(payload: AbsenceAiValidationJob, jobOptions?: JobsOptions) {
            await queue.add(AI_VALIDATION_JOB_NAME, payload, jobOptions);
        },
    };
}

let client: AbsenceAiQueueClient | null = null;

function resolveOptions(overrides?: AbsenceAiQueueOptions): AbsenceAiQueueOptions {
    return {
        queueName: overrides?.queueName ?? WORKER_QUEUE_NAMES.HR_ABSENCE_AI_VALIDATION,
        defaultJobOptions: overrides?.defaultJobOptions,
    };
}

export function getAbsenceAiQueueClient(options?: AbsenceAiQueueOptions): AbsenceAiQueueClient {
    client ??= createAbsenceAiQueueClient(resolveOptions(options));
    return client;
}

