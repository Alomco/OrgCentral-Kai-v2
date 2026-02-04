import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOnboardingMetricDefinitionRepository } from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import type { OnboardingMetricDefinitionRecord } from '@/server/types/hr/onboarding-metrics';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface CreateMetricDefinitionInput {
    authorization: RepositoryAuthorizationContext;
    key: string;
    label: string;
    unit?: string | null;
    targetValue?: number | null;
    isActive?: boolean;
}

export interface CreateMetricDefinitionDependencies {
    definitionRepository: IOnboardingMetricDefinitionRepository;
}

export interface CreateMetricDefinitionResult {
    definition: OnboardingMetricDefinitionRecord;
}

export async function createMetricDefinition(
    deps: CreateMetricDefinitionDependencies,
    input: CreateMetricDefinitionInput,
): Promise<CreateMetricDefinitionResult> {
    assertOnboardingConfigManager(input.authorization);

    const definition = await deps.definitionRepository.createDefinition({
        orgId: input.authorization.orgId,
        key: input.key.trim(),
        label: input.label.trim(),
        unit: input.unit ?? null,
        targetValue: input.targetValue ?? null,
        isActive: input.isActive,
        thresholds: null,
        metadata: null,
        dataClassification: input.authorization.dataClassification,
        residencyTag: input.authorization.dataResidency,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        createdBy: input.authorization.userId,
    });

    return { definition };
}
