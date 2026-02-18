import type { IBrandingRepository } from '@/server/repositories/contracts/org/branding/branding-repository-contract';
import type { IPlatformBrandingRepository } from '@/server/repositories/contracts/platform/branding/platform-branding-repository-contract';
import type { BrandingServiceDependencies } from '@/server/repositories/contracts/org/branding/branding-service-dependencies';
import { AuthorizationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import type { OrgBranding, PlatformBranding } from '@/server/types/branding-types';

export type { BrandingServiceDependencies };

export interface GetOrgBrandingInput {
    orgId: string;
    authorization?: Pick<RepositoryAuthorizationContext, 'orgId'>;
}

export class BrandingService extends AbstractBaseService {
    private readonly orgBrandingRepository: IBrandingRepository;
    private readonly platformBrandingRepository: IPlatformBrandingRepository;

    constructor(dependencies: BrandingServiceDependencies) {
        super();
        this.orgBrandingRepository = dependencies.orgBrandingRepository;
        this.platformBrandingRepository = dependencies.platformBrandingRepository;
    }

    getOrgBranding(input: GetOrgBrandingInput | string): Promise<OrgBranding | null> {
        const normalizedInput = typeof input === 'string'
            ? { orgId: input }
            : input;

        if (
            normalizedInput.authorization
            && normalizedInput.authorization.orgId !== normalizedInput.orgId
        ) {
            throw new AuthorizationError('Cross-tenant branding access denied.');
        }

        return this.orgBrandingRepository.getBranding(normalizedInput.orgId);
    }

    getPlatformBranding(): Promise<PlatformBranding | null> {
        return this.platformBrandingRepository.getBranding();
    }
}
