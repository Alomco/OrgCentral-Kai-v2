import type { WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/workers/constants';
import { onboardingReminderEnvelopeSchema, type OnboardingReminderPayload } from './onboarding-reminder.types';
import { OnboardingReminderProcessor } from './onboarding-reminder.processor';

export class OnboardingReminderWorker extends AbstractOrgWorker<OnboardingReminderPayload> {
    private readonly processor: OnboardingReminderProcessor;

    constructor(options?: { worker?: WorkerOptions; processor?: OnboardingReminderProcessor }) {
        super({
            queueName: WORKER_QUEUE_NAMES.HR_ONBOARDING_REMINDER,
            workerName: 'hr.onboarding.reminder',
            schema: onboardingReminderEnvelopeSchema,
        });
        this.processor = options?.processor ?? new OnboardingReminderProcessor();
    }

    protected async process(payload: OnboardingReminderPayload, context: RepositoryAuthorizationContext) {
        const result = await this.processor.process(payload, context);
        this.logger.info('hr.onboarding.reminder.completed', {
            orgId: context.orgId,
            ...result
        });
        return result;
    }
}

export function registerOnboardingReminderWorker(options?: { worker?: WorkerOptions }) {
    const worker = new OnboardingReminderWorker(options);
    return worker.registerWorker(options?.worker);
}

