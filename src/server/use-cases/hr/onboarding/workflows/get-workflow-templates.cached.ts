import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_LONG } from '@/server/repositories/cache-profiles';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { AuthorizationError } from '@/server/errors';
import type { IOnboardingWorkflowTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OnboardingWorkflowTemplateRecord, WorkflowTemplateType } from '@/server/types/hr/onboarding-workflow-templates';
import { CACHE_SCOPE_ONBOARDING_WORKFLOW_TEMPLATES } from '@/server/repositories/cache-scopes';
import { buildOnboardingWorkflowDependencies } from './workflow-repository-dependencies';
import { listWorkflowTemplates } from './list-workflow-templates';

export interface GetWorkflowTemplatesForUiInput {
    authorization: RepositoryAuthorizationContext;
    templateType?: WorkflowTemplateType;
    isActive?: boolean;
}

export interface GetWorkflowTemplatesForUiResult {
    templates: OnboardingWorkflowTemplateRecord[];
    canManageTemplates: boolean;
}

function resolveWorkflowTemplateRepository(): IOnboardingWorkflowTemplateRepository {
    return buildOnboardingWorkflowDependencies().workflowTemplateRepository;
}

async function loadWorkflowTemplates(
    input: GetWorkflowTemplatesForUiInput,
): Promise<GetWorkflowTemplatesForUiResult> {
    try {
        const result = await listWorkflowTemplates(
            { workflowTemplateRepository: resolveWorkflowTemplateRepository() },
            input,
        );
        return { templates: result.templates, canManageTemplates: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { templates: [], canManageTemplates: false };
        }
        throw error;
    }
}

export async function getWorkflowTemplatesForUi(
    input: GetWorkflowTemplatesForUiInput,
): Promise<GetWorkflowTemplatesForUiResult> {
    async function getWorkflowTemplatesCached(
        cachedInput: GetWorkflowTemplatesForUiInput,
    ): Promise<GetWorkflowTemplatesForUiResult> {
        'use cache';
        cacheLife(CACHE_LIFE_LONG);

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_WORKFLOW_TEMPLATES,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        return loadWorkflowTemplates(cachedInput);
    }

    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadWorkflowTemplates(input);
    }

    return getWorkflowTemplatesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
