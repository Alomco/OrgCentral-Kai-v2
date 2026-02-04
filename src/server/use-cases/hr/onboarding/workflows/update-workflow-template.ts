import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOnboardingWorkflowTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import type { OnboardingWorkflowTemplateRecord, WorkflowTemplateType } from '@/server/types/hr/onboarding-workflow-templates';
import type { JsonValue } from '@/server/types/json';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface UpdateWorkflowTemplateInput {
    authorization: RepositoryAuthorizationContext;
    templateId: string;
    updates: {
        name?: string;
        description?: string | null;
        templateType?: WorkflowTemplateType;
        definition?: JsonValue;
        isActive?: boolean;
        version?: number;
    };
}

export interface UpdateWorkflowTemplateDependencies {
    workflowTemplateRepository: IOnboardingWorkflowTemplateRepository;
}

export interface UpdateWorkflowTemplateResult {
    template: OnboardingWorkflowTemplateRecord;
}

export async function updateWorkflowTemplate(
    deps: UpdateWorkflowTemplateDependencies,
    input: UpdateWorkflowTemplateInput,
): Promise<UpdateWorkflowTemplateResult> {
    assertOnboardingConfigManager(input.authorization);

    const template = await deps.workflowTemplateRepository.updateTemplate(
        input.authorization.orgId,
        input.templateId,
        {
            name: input.updates.name?.trim(),
            description: input.updates.description ?? undefined,
            templateType: input.updates.templateType,
            definition: input.updates.definition,
            isActive: input.updates.isActive,
            version: input.updates.version,
            updatedBy: input.authorization.userId,
        },
    );

    return { template };
}
