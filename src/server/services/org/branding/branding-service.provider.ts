import { buildBrandingService } from '@/server/use-cases/org/branding/branding-service-composition';
import type { BrandingService } from './branding-service';

let sharedBrandingService: BrandingService | null = null;

export function getBrandingService(overrides?: Parameters<typeof buildBrandingService>[0]): BrandingService {
    if (!sharedBrandingService || (overrides && Object.keys(overrides).length > 0)) {
        sharedBrandingService = buildBrandingService(overrides);
    }
    return sharedBrandingService;
}

export type BrandingServiceContract = BrandingService;
