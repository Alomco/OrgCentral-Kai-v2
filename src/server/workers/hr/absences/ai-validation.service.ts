import type { ResultAsync } from 'neverthrow';
import { authorizeAbsenceAiJob, parseAbsenceAiJob } from './ai-validation.auth';
import type { AbsenceAiValidationResult, AbsenceAiValidationServiceDeps } from './ai-validation.types';
import { AbsenceAiValidationProcessor } from '@/server/use-cases/hr/absences/process-ai-validation';

export class AbsenceAiValidationService {
    private readonly processor: AbsenceAiValidationProcessor;

    constructor(deps: AbsenceAiValidationServiceDeps) {
        this.processor = new AbsenceAiValidationProcessor(deps);
    }
    handle(payload: unknown): ResultAsync<AbsenceAiValidationResult, Error> {
        return parseAbsenceAiJob(payload).andThen((parsed) =>
            authorizeAbsenceAiJob(parsed).andThen(({ authorization }) =>
                this.processor.process(parsed, authorization),
            ),
        );
    }
}
