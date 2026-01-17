// src/server/services/seeder/seed-org-assets.ts
import { faker } from '@faker-js/faker';
import { buildHrPolicyServiceDependencies } from '@/server/repositories/providers/hr/hr-policy-service-dependencies';
import { buildLocationServiceDependencies } from '@/server/repositories/providers/hr/location-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

export async function seedOrgAssetsInternal(options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const { locationRepository } = buildLocationServiceDependencies();
        const { policyRepository } = buildHrPolicyServiceDependencies();

        // 1. Locations
        const locations = ['Headquarters', 'London Branch', 'Remote Hub', 'Innovation Center'];
        for (const name of locations) {
            await locationRepository.createLocation(authorization, {
                name,
                address: faker.location.streetAddress({ useFullAddress: true }),
                phone: faker.phone.number(),
            });
        }

        // 2. HR Policies
        const policies = ['Employee Handbook', 'Remote Work Policy', 'Code of Conduct', 'IT Security Policy'];
        for (const title of policies) {
            await policyRepository.createPolicy(org.id, {
                title,
                content: faker.lorem.paragraphs(3),
                category: title === 'IT Security Policy' ? 'IT_SECURITY' : 'HR_POLICIES',
                version: 'v1.0',
                effectiveDate: faker.date.past(),
                requiresAcknowledgment: true,
                status: 'published',
                dataClassification: org.dataClassification,
                residencyTag: org.dataResidency,
                metadata: getSeededMetadata(),
            });
        }

        return { success: true, message: 'Seeded Locations and Policies.' };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
