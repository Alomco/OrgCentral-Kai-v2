import type {
    OnboardingFeedbackCreateInput,
    OnboardingFeedbackRecord,
} from '@/server/types/hr/onboarding-feedback';

export interface OnboardingFeedbackListFilters {
    employeeId?: string;
}

export interface IOnboardingFeedbackRepository {
    createFeedback(input: OnboardingFeedbackCreateInput): Promise<OnboardingFeedbackRecord>;
    listFeedback(orgId: string, filters?: OnboardingFeedbackListFilters): Promise<OnboardingFeedbackRecord[]>;
}
