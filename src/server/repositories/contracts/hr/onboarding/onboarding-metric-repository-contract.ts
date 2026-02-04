import type {
    OnboardingMetricDefinitionCreateInput,
    OnboardingMetricDefinitionRecord,
    OnboardingMetricDefinitionUpdateInput,
    OnboardingMetricResultCreateInput,
    OnboardingMetricResultRecord,
} from '@/server/types/hr/onboarding-metrics';

export interface OnboardingMetricDefinitionListFilters {
    isActive?: boolean;
}

export interface OnboardingMetricResultListFilters {
    employeeId?: string;
    metricId?: string;
}

export interface IOnboardingMetricDefinitionRepository {
    createDefinition(input: OnboardingMetricDefinitionCreateInput): Promise<OnboardingMetricDefinitionRecord>;
    updateDefinition(
        orgId: string,
        definitionId: string,
        updates: OnboardingMetricDefinitionUpdateInput,
    ): Promise<OnboardingMetricDefinitionRecord>;
    getDefinition(orgId: string, definitionId: string): Promise<OnboardingMetricDefinitionRecord | null>;
    listDefinitions(
        orgId: string,
        filters?: OnboardingMetricDefinitionListFilters,
    ): Promise<OnboardingMetricDefinitionRecord[]>;
}

export interface IOnboardingMetricResultRepository {
    createResult(input: OnboardingMetricResultCreateInput): Promise<OnboardingMetricResultRecord>;
    listResults(orgId: string, filters?: OnboardingMetricResultListFilters): Promise<OnboardingMetricResultRecord[]>;
}
