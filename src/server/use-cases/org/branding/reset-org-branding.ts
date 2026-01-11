import { AuthorizationError } from '@/server/errors';
import type { IBrandingRepository } from '@/server/repositories/contracts/org/branding/branding-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_BRANDING } from '@/server/repositories/cache-scopes';

export interface ResetOrgBrandingDependencies {
    brandingRepository: IBrandingRepository;
}

export interface ResetOrgBrandingInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
}

export interface ResetOrgBrandingResult {
    success: true;
}

export async function resetOrgBranding(
    deps: ResetOrgBrandingDependencies,
    input: ResetOrgBrandingInput,
): Promise<ResetOrgBrandingResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant branding reset denied.');
    }

    await deps.brandingRepository.resetBranding(input.orgId);

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_BRANDING,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );
    return { success: true };
}
