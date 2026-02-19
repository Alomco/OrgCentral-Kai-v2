import type { PrismaClient } from '../../src/generated/client';
import type { PersonaCatalogRecord } from './types';
import { readSeedCatalogFile } from './catalog-schema';
import { buildAbacPolicyServiceDependencies } from '@/server/repositories/providers/org/abac-policy-service-dependencies';
import { buildPermissionResourceServiceDependencies } from '@/server/repositories/providers/org/permission-resource-service-dependencies';
import {
    deriveExpectedState,
    extractSecuritySettings,
    getAuthOrgMember,
    getAuthUser,
    getCredentialCount,
    getMembership,
    getProfile,
    requiresProfileSetup,
    validateAuthOrgMember,
    validateCredentialState,
    validateMembershipDetails,
    validateMembershipPresence,
    validateNoOrganization,
    validateProfile,
    validateTwoFactorState,
} from './verification-helpers';

interface OrganizationContext {
    id: string;
    mfaRequired: boolean;
}



export interface VerifySeedResult {
    personaCount: number;
    organizationCount: number;
    failures: string[];
}

export async function verifySeededAccounts(
    prisma: PrismaClient,
    catalogPath: string,
): Promise<VerifySeedResult> {
    const catalog = await readSeedCatalogFile(catalogPath);
    const failures: string[] = [];
    const organizations = await getOrganizationMap(prisma, catalog.personas);
    const { permissionRepository } = buildPermissionResourceServiceDependencies();
    const { abacPolicyRepository } = buildAbacPolicyServiceDependencies();

    for (const persona of catalog.personas) {
        await validatePersona(prisma, persona, failures, organizations);
    }

    const orgSlugs = new Set(
        catalog.personas
            .map((persona) => persona.organizationSlug)
            .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0),
    );

    for (const slug of orgSlugs) {
        await validateOrgFoundations(prisma, slug, failures, permissionRepository, abacPolicyRepository);
    }

    return {
        personaCount: catalog.personas.length,
        organizationCount: orgSlugs.size,
        failures,
    };
}

async function validatePersona(
    prisma: PrismaClient,
    persona: PersonaCatalogRecord,
    failures: string[],
    organizations: Map<string, OrganizationContext>,
): Promise<void> {
    const authUser = await getAuthUser(prisma, persona, failures);
    if (!authUser) {
        return;
    }

    const credentialCount = await getCredentialCount(prisma, authUser.id);
    validateCredentialState(persona, credentialCount, failures);
    validateTwoFactorState(persona, authUser, failures);

    if (!persona.organizationSlug) {
        await validateNoOrganization(prisma, persona, authUser.id, failures);
        return;
    }

    const organization = organizations.get(persona.organizationSlug);
    if (!organization) {
        failures.push(`${persona.key}: organization ${persona.organizationSlug} missing`);
        return;
    }

    const membership = await getMembership(prisma, organization.id, authUser.id);
    if (!validateMembershipPresence(persona, membership, failures)) {
        return;
    }
    if (!membership) {
        return;
    }

    validateMembershipDetails(persona, membership, failures);

    const profile = await getProfile(prisma, organization.id, authUser.id);
    validateProfile(persona, profile, failures);

    const derivedState = deriveExpectedState({
        membershipStatus: membership.status,
        hasCredentialPassword: credentialCount > 0,
        requiresProfileSetup: requiresProfileSetup(persona, profile),
        mfaRequired: organization.mfaRequired,
        twoFactorEnabled: authUser.twoFactorEnabled === true,
    });

    if (persona.state !== derivedState) {
        failures.push(`${persona.key}: state mismatch (${persona.state} != ${derivedState})`);
    }

    const authOrgMember = await getAuthOrgMember(prisma, organization.id, authUser.id);
    validateAuthOrgMember(persona, authOrgMember, failures);
}


async function validateOrgFoundations(
    prisma: PrismaClient,
    orgSlug: string,
    failures: string[],
    permissionRepository: ReturnType<typeof buildPermissionResourceServiceDependencies>['permissionRepository'],
    abacPolicyRepository: ReturnType<typeof buildAbacPolicyServiceDependencies>['abacPolicyRepository'],
): Promise<void> {
    const organization = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true, settings: true },
    });
    if (!organization) {
        failures.push(`org ${orgSlug}: missing`);
        return;
    }

    const resources = await permissionRepository.listResources(organization.id);
    if (resources.length === 0) {
        failures.push(`org ${orgSlug}: permission resources missing`);
    }

    const policies = await abacPolicyRepository.getPoliciesForOrg(organization.id);
    if (policies.length === 0) {
        failures.push(`org ${orgSlug}: ABAC policies missing`);
    }

    const security = extractSecuritySettings(organization.settings);
    if (typeof security.mfaRequired !== 'boolean') {
        failures.push(`org ${orgSlug}: security.mfaRequired is not set`);
    }
}

async function getOrganizationMap(
    prisma: PrismaClient,
    personas: readonly PersonaCatalogRecord[],
): Promise<Map<string, OrganizationContext>> {
    const slugs = [...new Set(personas
        .map((persona) => persona.organizationSlug)
        .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0))];
    if (slugs.length === 0) {
        return new Map();
    }

    const organizations = await prisma.organization.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true, settings: true },
    });

    return new Map(
        organizations.map((organization) => {
            const security = extractSecuritySettings(organization.settings);
            return [organization.slug, { id: organization.id, mfaRequired: security.mfaRequired === true }];
        }),
    );
}

