import { AuthorizationError } from '@/server/errors';
import type { IBrandingRepository } from '@/server/repositories/contracts/org/branding/branding-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { OrgBranding } from '@/server/types/branding-types';

export interface GetOrgBrandingDependencies {
    brandingRepository: IBrandingRepository;
}

export interface GetOrgBrandingInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
}

export interface GetOrgBrandingResult {
    branding: OrgBranding | null;
}

export async function getOrgBranding(
    deps: GetOrgBrandingDependencies,
    input: GetOrgBrandingInput,
): Promise<GetOrgBrandingResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant branding access denied.');
    }

    const branding = await deps.brandingRepository.getBranding(input.orgId);
    return { branding };
}
