import type { WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    TRAINING_REMINDER_JOB_NAME,
    trainingReminderEnvelopeSchema,
    type TrainingReminderPayload,
} from './reminder.types';
import { TrainingReminderProcessor } from './reminder.processor';

export interface TrainingReminderWorkerOptions {
    worker?: WorkerOptions;
    processor?: TrainingReminderProcessor;
}

export class TrainingReminderWorker extends AbstractOrgWorker<TrainingReminderPayload> {
    private readonly processor: TrainingReminderProcessor;

    constructor(options?: TrainingReminderWorkerOptions) {
        super({
            queueName: WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER,
            workerName: TRAINING_REMINDER_JOB_NAME,
            schema: trainingReminderEnvelopeSchema,
        });
        this.processor = options?.processor ?? new TrainingReminderProcessor();
    }

    protected async process(
        payload: TrainingReminderPayload,
        context: RepositoryAuthorizationContext,
    ): Promise<unknown> {
        const result = await this.processor.process(payload, context);
        this.logger.info('hr.training.reminder.processed', {
            orgId: context.orgId,
            remindersSent: result.remindersSent,
            usersTargeted: result.usersTargeted,
        });
        return result;
    }
}

export function registerTrainingReminderWorker(options?: TrainingReminderWorkerOptions) {
    const worker = new TrainingReminderWorker(options);
    return worker.registerWorker(options?.worker);
}

