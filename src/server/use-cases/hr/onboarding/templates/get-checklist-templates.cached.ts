import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { AuthorizationError } from '@/server/errors';
import type { IChecklistTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import { PrismaChecklistTemplateRepository } from '@/server/repositories/prisma/hr/onboarding';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ChecklistTemplate, ChecklistTemplateType } from '@/server/types/onboarding-types';

import { listChecklistTemplates } from './list-checklist-templates';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_TEMPLATES } from '@/server/repositories/cache-scopes';

export interface GetChecklistTemplatesForUiInput {
    authorization: RepositoryAuthorizationContext;
    type?: ChecklistTemplateType;
}

export interface GetChecklistTemplatesForUiResult {
    templates: ChecklistTemplate[];
    canManageTemplates: boolean;
}

function resolveChecklistTemplateRepository(): IChecklistTemplateRepository {
    return new PrismaChecklistTemplateRepository();
}

async function loadChecklistTemplates(
    input: GetChecklistTemplatesForUiInput,
): Promise<GetChecklistTemplatesForUiResult> {
    try {
        const result = await listChecklistTemplates(
            { checklistTemplateRepository: resolveChecklistTemplateRepository() },
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

export async function getChecklistTemplatesForUi(
    input: GetChecklistTemplatesForUiInput,
): Promise<GetChecklistTemplatesForUiResult> {
    async function getChecklistTemplatesCached(
        cachedInput: GetChecklistTemplatesForUiInput,
    ): Promise<GetChecklistTemplatesForUiResult> {
        'use cache';
        cacheLife('hours');

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        return loadChecklistTemplates(cachedInput);
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadChecklistTemplates(input);
    }

    return getChecklistTemplatesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
