import { trainingReminderPayloadSchema, type TrainingReminderPayload } from './reminder.types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    buildTrainingReminderDependencies,
    sendTrainingReminders,
    type TrainingReminderDependencies,
    type TrainingReminderResult,
} from '@/server/use-cases/hr/training/send-training-reminders';

export type TrainingReminderProcessorResult = TrainingReminderResult;

export type TrainingReminderProcessorDependencies = Partial<TrainingReminderDependencies>;

export class TrainingReminderProcessor {
    private readonly deps: TrainingReminderDependencies;

    constructor(deps?: TrainingReminderProcessorDependencies) {
        this.deps = buildTrainingReminderDependencies(deps);
    }

    async process(
        payload: TrainingReminderPayload,
        authorization: RepositoryAuthorizationContext,
    ): Promise<TrainingReminderProcessorResult> {
        const parsedPayload = trainingReminderPayloadSchema.parse(payload);
        return sendTrainingReminders(this.deps, {
            authorization,
            payload: parsedPayload,
        });
    }
}
