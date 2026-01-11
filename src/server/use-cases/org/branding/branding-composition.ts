import { PrismaBrandingRepository } from '@/server/repositories/prisma/org/branding/prisma-branding-repository';
import type { IBrandingRepository } from '@/server/repositories/contracts/org/branding/branding-repository-contract';
import type { GetOrgBrandingInput, GetOrgBrandingResult } from './get-org-branding';
import { getOrgBranding } from './get-org-branding';
import type { UpdateOrgBrandingInput, UpdateOrgBrandingResult } from './update-org-branding';
import { updateOrgBranding } from './update-org-branding';
import type { ResetOrgBrandingInput, ResetOrgBrandingResult } from './reset-org-branding';
import { resetOrgBranding } from './reset-org-branding';

export interface BrandingUseCaseDependencies {
    brandingRepository: IBrandingRepository;
}

interface BrandingCompositionOverrides {
    brandingRepository?: IBrandingRepository;
}

function buildBrandingDependencies(overrides?: BrandingCompositionOverrides): BrandingUseCaseDependencies {
    if (overrides?.brandingRepository) {
        return { brandingRepository: overrides.brandingRepository };
    }
    return { brandingRepository: new PrismaBrandingRepository() };
}

export function getOrgBrandingWithPrisma(
    input: GetOrgBrandingInput,
    overrides?: BrandingCompositionOverrides,
): Promise<GetOrgBrandingResult> {
    return getOrgBranding(buildBrandingDependencies(overrides), input);
}

export function updateOrgBrandingWithPrisma(
    input: UpdateOrgBrandingInput,
    overrides?: BrandingCompositionOverrides,
): Promise<UpdateOrgBrandingResult> {
    return updateOrgBranding(buildBrandingDependencies(overrides), input);
}

export function resetOrgBrandingWithPrisma(
    input: ResetOrgBrandingInput,
    overrides?: BrandingCompositionOverrides,
): Promise<ResetOrgBrandingResult> {
    return resetOrgBranding(buildBrandingDependencies(overrides), input);
}