import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_LONG } from '@/server/repositories/cache-profiles';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { AuthorizationError } from '@/server/errors';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import type { DocumentType } from '@/server/types/records/document-vault';
import { CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES } from '@/server/repositories/cache-scopes';
import { buildDocumentTemplateDependencies } from './document-template-dependencies';
import { listDocumentTemplates } from './list-document-templates';

export interface GetDocumentTemplatesForUiInput {
    authorization: RepositoryAuthorizationContext;
    isActive?: boolean;
    type?: DocumentType;
}

export interface GetDocumentTemplatesForUiResult {
    templates: DocumentTemplateRecord[];
    canManageTemplates: boolean;
}

async function loadTemplates(
    input: GetDocumentTemplatesForUiInput,
): Promise<GetDocumentTemplatesForUiResult> {
    try {
        const result = await listDocumentTemplates(
            { documentTemplateRepository: buildDocumentTemplateDependencies().documentTemplateRepository },
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

export async function getDocumentTemplatesForUi(
    input: GetDocumentTemplatesForUiInput,
): Promise<GetDocumentTemplatesForUiResult> {
    async function getTemplatesCached(
        cachedInput: GetDocumentTemplatesForUiInput,
    ): Promise<GetDocumentTemplatesForUiResult> {
        'use cache';
        cacheLife(CACHE_LIFE_LONG);

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES,
            cachedInput.authorization.dataClassification,
            cachedInput.authorization.dataResidency,
        );

        return loadTemplates(cachedInput);
    }

    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadTemplates(input);
    }

    return getTemplatesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
