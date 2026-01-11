import { type RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OnboardingReminderPayload } from './onboarding-reminder.types';
import {
    buildOnboardingReminderDependencies,
    sendOnboardingReminders,
    type OnboardingReminderDependencies,
    type OnboardingReminderResult,
} from '@/server/use-cases/hr/onboarding/send-onboarding-reminders';

export class OnboardingReminderProcessor {
    private readonly deps: OnboardingReminderDependencies;

    constructor(deps: Partial<OnboardingReminderDependencies> = {}) {
        this.deps = buildOnboardingReminderDependencies(deps);
    }

    async process(
        payload: OnboardingReminderPayload,
        context: RepositoryAuthorizationContext,
    ): Promise<OnboardingReminderResult> {
        return sendOnboardingReminders(this.deps, {
            authorization: context,
            payload,
        });
    }
}
