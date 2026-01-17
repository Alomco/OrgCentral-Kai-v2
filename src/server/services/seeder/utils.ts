import type { OrganizationData } from '@/server/types/leave-types';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { buildOrganizationServiceDependencies } from '@/server/repositories/providers/org/organization-service-dependencies';
import { buildPeopleServiceDependencies } from '@/server/repositories/providers/hr/people-service-dependencies';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';

export const SEEDED_METADATA_KEY = 'devSeeded';
const DEFAULT_PLATFORM_ORG_SLUG = 'orgcentral-platform';
export const PLATFORM_ORG_SLUG = process.env.PLATFORM_ORG_SLUG ?? DEFAULT_PLATFORM_ORG_SLUG;
export const DEFAULT_SEEDER_USER_ID = 'system-seed';
export const DEFAULT_SEEDER_AUDIT_SOURCE = 'dev-seeder';
export const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export interface SeedResult {
    success: boolean;
    message: string;
    count?: number;
}

export interface SeedContextOptions {
    orgId?: string;
    userId?: string;
    auditSource?: string;
}

export async function getDefaultOrg() {
    const { organizationRepository } = buildOrganizationServiceDependencies();
    const org = await organizationRepository.getOrganizationBySlug(PLATFORM_ORG_SLUG);
    if (!org) {
        throw new Error('No organizations found. Please bootstrap the platform org first.');
    }
    return org;
}

export async function resolveSeedOrganization(options?: SeedContextOptions): Promise<OrganizationData> {
    if (options?.orgId) {
        const { organizationRepository } = buildOrganizationServiceDependencies();
        const org = await organizationRepository.getOrganization(options.orgId);
        if (!org) {
            throw new Error('Organization not found for seeding.');
        }
        return org;
    }

    return getDefaultOrg();
}

export async function getActiveMembers(
    orgId: string,
    limit = 50,
): Promise<EmployeeProfileDTO[]> {
    const { profileRepo } = buildPeopleServiceDependencies();
    const profiles = await profileRepo.getEmployeeProfilesByOrganization(orgId);
    return profiles.slice(0, limit);
}

export function buildSeederAuthorization(
    org: OrganizationData,
    userId = DEFAULT_SEEDER_USER_ID,
    auditSource = DEFAULT_SEEDER_AUDIT_SOURCE,
): RepositoryAuthorizationContext {
    return buildAuthorizationContext({
        orgId: org.id,
        userId,
        dataResidency: org.dataResidency,
        dataClassification: org.dataClassification,
        auditSource,
        tenantScope: {
            orgId: org.id,
            dataResidency: org.dataResidency,
            dataClassification: org.dataClassification,
            auditSource,
        },
    });
}

export function resolveSeederAuthorization(
    org: OrganizationData,
    options?: SeedContextOptions,
): RepositoryAuthorizationContext {
    return buildSeederAuthorization(
        org,
        options?.userId ?? DEFAULT_SEEDER_USER_ID,
        options?.auditSource ?? DEFAULT_SEEDER_AUDIT_SOURCE,
    );
}

type SeededMetadata = Record<string, boolean | string | number | null>;

export function getSeededMetadata(extra: SeededMetadata = {}): SeededMetadata {
    return {
        [SEEDED_METADATA_KEY]: true,
        seededAt: new Date().toISOString(),
        ...extra,
    };
}
