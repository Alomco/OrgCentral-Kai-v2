import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOnboardingWorkflowTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import type { OnboardingWorkflowTemplateRecord } from '@/server/types/hr/onboarding-workflow-templates';
import type { JsonValue } from '@/server/types/json';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface CreateWorkflowTemplateInput {
    authorization: RepositoryAuthorizationContext;
    name: string;
    description?: string | null;
    templateType: OnboardingWorkflowTemplateRecord['templateType'];
    definition: JsonValue;
    version?: number;
    isActive?: boolean;
}

export interface CreateWorkflowTemplateDependencies {
    workflowTemplateRepository: IOnboardingWorkflowTemplateRepository;
}

export interface CreateWorkflowTemplateResult {
    template: OnboardingWorkflowTemplateRecord;
}

export async function createWorkflowTemplate(
    deps: CreateWorkflowTemplateDependencies,
    input: CreateWorkflowTemplateInput,
): Promise<CreateWorkflowTemplateResult> {
    assertOnboardingConfigManager(input.authorization);

    const template = await deps.workflowTemplateRepository.createTemplate({
        orgId: input.authorization.orgId,
        name: input.name.trim(),
        description: input.description ?? null,
        templateType: input.templateType,
        definition: input.definition,
        version: input.version,
        isActive: input.isActive,
        dataClassification: input.authorization.dataClassification,
        residencyTag: input.authorization.dataResidency,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        createdBy: input.authorization.userId,
        metadata: null,
    });

    return { template };
}
