import { AuthorizationError } from '@/server/errors';
import type { IBrandingRepository } from '@/server/repositories/contracts/org/branding/branding-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { OrgBranding } from '@/server/types/branding-types';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_BRANDING } from '@/server/repositories/cache-scopes';

export interface UpdateOrgBrandingDependencies {
    brandingRepository: IBrandingRepository;
}

export interface UpdateOrgBrandingInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
    updates: Partial<OrgBranding>;
}

export interface UpdateOrgBrandingResult {
    branding: OrgBranding;
}

export async function updateOrgBranding(
    deps: UpdateOrgBrandingDependencies,
    input: UpdateOrgBrandingInput,
): Promise<UpdateOrgBrandingResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant branding update denied.');
    }

    const branding = await deps.brandingRepository.updateBranding(input.orgId, input.updates);
    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_BRANDING,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );
    return { branding };
}
