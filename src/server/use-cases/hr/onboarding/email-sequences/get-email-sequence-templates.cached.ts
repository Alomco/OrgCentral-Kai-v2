import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_LONG } from '@/server/repositories/cache-profiles';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import { AuthorizationError } from '@/server/errors';
import type { IEmailSequenceTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmailSequenceTemplateRecord, EmailSequenceTrigger } from '@/server/types/hr/onboarding-email-sequences';
import { CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES } from '@/server/repositories/cache-scopes';
import { buildEmailSequenceDependencies } from './sequence-repository-dependencies';
import { listEmailSequenceTemplates } from './list-email-sequence-templates';

export interface GetEmailSequenceTemplatesForUiInput {
    authorization: RepositoryAuthorizationContext;
    trigger?: EmailSequenceTrigger;
    isActive?: boolean;
}

export interface GetEmailSequenceTemplatesForUiResult {
    templates: EmailSequenceTemplateRecord[];
    canManageTemplates: boolean;
}

function resolveTemplateRepository(): IEmailSequenceTemplateRepository {
    return buildEmailSequenceDependencies().templateRepository;
}

async function loadTemplates(
    input: GetEmailSequenceTemplatesForUiInput,
): Promise<GetEmailSequenceTemplatesForUiResult> {
    try {
        const result = await listEmailSequenceTemplates({ templateRepository: resolveTemplateRepository() }, input);
        return { templates: result.templates, canManageTemplates: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { templates: [], canManageTemplates: false };
        }
        throw error;
    }
}

export async function getEmailSequenceTemplatesForUi(
    input: GetEmailSequenceTemplatesForUiInput,
): Promise<GetEmailSequenceTemplatesForUiResult> {
    async function getTemplatesCached(
        cachedInput: GetEmailSequenceTemplatesForUiInput,
    ): Promise<GetEmailSequenceTemplatesForUiResult> {
        'use cache';
        cacheLife(CACHE_LIFE_LONG);

        registerOrgCacheTag(
            cachedInput.authorization.orgId,
            CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES,
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
