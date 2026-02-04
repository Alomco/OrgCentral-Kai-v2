import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOnboardingMetricDefinitionRepository } from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import type { OnboardingMetricDefinitionRecord } from '@/server/types/hr/onboarding-metrics';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface ListMetricDefinitionsInput {
    authorization: RepositoryAuthorizationContext;
    isActive?: boolean;
}

export interface ListMetricDefinitionsDependencies {
    definitionRepository: IOnboardingMetricDefinitionRepository;
}

export interface ListMetricDefinitionsResult {
    definitions: OnboardingMetricDefinitionRecord[];
}

export async function listMetricDefinitions(
    deps: ListMetricDefinitionsDependencies,
    input: ListMetricDefinitionsInput,
): Promise<ListMetricDefinitionsResult> {
    assertOnboardingConfigManager(input.authorization);
    const definitions = await deps.definitionRepository.listDefinitions(input.authorization.orgId, {
        isActive: input.isActive,
    });
    return { definitions };
}
