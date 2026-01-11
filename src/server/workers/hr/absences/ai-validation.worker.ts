import { Worker, type WorkerOptions } from 'bullmq';
import { buildAbsenceAiValidationDependencies } from '@/server/use-cases/hr/absences/ai-validation.provider';
import type { AbsenceAiValidationResult } from './ai-validation.types';
import { AbsenceAiValidationService } from './ai-validation.service';
import {
    AI_VALIDATION_JOB_NAME,
    getAbsenceAiQueueClient,
    type AbsenceAiQueueOptions,
} from './ai-validation.queue';

export interface AbsenceAiWorkerOptions {
    worker?: WorkerOptions;
    queue?: AbsenceAiQueueOptions;
    service?: Pick<AbsenceAiValidationService, 'handle'>;
}

export function createAbsenceAiProcessor(service: Pick<AbsenceAiValidationService, 'handle'>) {
    return async (job: { data: unknown; name?: string }): Promise<AbsenceAiValidationResult> => {
        if (job.name && job.name !== AI_VALIDATION_JOB_NAME) {
            return Promise.reject(new Error(`Unsupported job received: ${job.name ?? 'unknown'}`));
        }
        const result = await service.handle(job.data);
        return result.match(
            (value) => value,
            (error) => {
                throw error;
            },
        );
    };
}

export function registerAbsenceAiWorker(options?: AbsenceAiWorkerOptions): Worker {
    const queueClient = getAbsenceAiQueueClient(options?.queue);
    const service: Pick<AbsenceAiValidationService, 'handle'> =
        options?.service ??
        new AbsenceAiValidationService(buildAbsenceAiValidationDependencies());

    const processor = createAbsenceAiProcessor(service);

    return new Worker(queueClient.queue.name, processor as never, {
        connection: queueClient.queue.opts.connection,
        concurrency: options?.worker?.concurrency ?? 2,
        ...options?.worker,
    });
}
