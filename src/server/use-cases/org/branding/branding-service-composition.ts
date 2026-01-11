import { PrismaBrandingRepository } from '@/server/repositories/prisma/org/branding/prisma-branding-repository';
import { PrismaPlatformBrandingRepository } from '@/server/repositories/prisma/platform/branding/prisma-platform-branding-repository';
import type { BrandingServiceDependencies } from '@/server/services/org/branding/branding-service';
import { BrandingService } from '@/server/services/org/branding/branding-service';

export function buildBrandingService(overrides?: Partial<BrandingServiceDependencies>): BrandingService {
    const dependencies: BrandingServiceDependencies = {
        orgBrandingRepository: overrides?.orgBrandingRepository ?? new PrismaBrandingRepository(),
        platformBrandingRepository:
            overrides?.platformBrandingRepository ?? new PrismaPlatformBrandingRepository(),
    };

    return new BrandingService(dependencies);
}