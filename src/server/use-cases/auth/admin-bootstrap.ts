import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
    ComplianceTier,
    DataClassificationLevel,
    DataResidencyZone,
    MembershipStatus,
    OrganizationStatus,
    RoleScope,
} from '@prisma/client';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import { resolveRoleTemplate } from '@/server/security/role-templates';
import { DEFAULT_BOOTSTRAP_POLICIES } from '@/server/security/abac-constants';
import { setAbacPolicies } from '@/server/use-cases/org/abac/set-abac-policies';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import type { createAuth } from '@/server/lib/auth';
import { syncBetterAuthUserToPrisma } from '@/server/lib/auth-sync';
import { AuthorizationError, ValidationError } from '@/server/errors';
import { prisma as defaultPrisma } from '@/server/lib/prisma';
import { PrismaAbacPolicyRepository } from '@/server/repositories/prisma/org/abac/prisma-abac-policy-repository';
import {
    BOOTSTRAP_SEED_SOURCE,
    assertUuid,
    constantTimeEquals,
    ensureAuthUserIdIsUuid,
    ensurePlatformAuthOrganization,
    isBootstrapEnabled,
    requireBootstrapSecret,
    resolvePlatformConfig,
} from './admin-bootstrap.helpers';

export interface AdminBootstrapDependencies {
    prisma: PrismaClient;
    abacPolicyRepository: IAbacPolicyRepository;
    auth: ReturnType<typeof createAuth>;
    syncAuthUser?: typeof syncBetterAuthUserToPrisma;
}

export type AdminBootstrapOverrides = {
    auth: AdminBootstrapDependencies['auth'];
} & Partial<Omit<AdminBootstrapDependencies, 'auth'>>;

export interface AdminBootstrapInput {
    token: string;
    requestHeaders: Headers;
}

export interface AdminBootstrapResult {
    orgId: string;
    role: string;
    redirectTo: string;
    setActiveHeaders: Headers;
}

export function buildAdminBootstrapDependencies(
    overrides: AdminBootstrapOverrides,
): AdminBootstrapDependencies {
    return {
        prisma: overrides.prisma ?? defaultPrisma,
        abacPolicyRepository: overrides.abacPolicyRepository ?? new PrismaAbacPolicyRepository(),
        auth: overrides.auth,
        syncAuthUser: overrides.syncAuthUser,
    };
}

export async function runAdminBootstrap(
    overrides: AdminBootstrapOverrides,
    input: AdminBootstrapInput,
): Promise<AdminBootstrapResult> {
    const deps = buildAdminBootstrapDependencies(overrides);
    if (!isBootstrapEnabled()) {
        throw new AuthorizationError('Admin bootstrap is disabled.');
    }

    const expectedSecret = requireBootstrapSecret();
    if (!constantTimeEquals(input.token, expectedSecret)) {
        throw new AuthorizationError('Invalid bootstrap secret.');
    }

    const session = await deps.auth.api.getSession({ headers: input.requestHeaders });
    if (!session?.session) {
        throw new AuthorizationError('Unauthenticated request.');
    }

    const userEmail = session.user.email;
    if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
        throw new ValidationError('Authenticated user is missing an email address.');
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const userId = await ensureAuthUserIdIsUuid(deps.prisma, session.user.id, normalizedEmail);
    assertUuid(userId, 'User id');

    const syncUser = deps.syncAuthUser ?? syncBetterAuthUserToPrisma;
    await syncUser({
        id: userId,
        email: normalizedEmail,
        name: typeof session.user.name === 'string' ? session.user.name : null,
        emailVerified: true,
        lastSignInAt: new Date(),
        updatedAt: new Date(),
    });

    const config = resolvePlatformConfig();
    const superAdminMetadata: Prisma.InputJsonObject = {
        seedSource: BOOTSTRAP_SEED_SOURCE,
        roles: [config.roleName],
        bootstrapProvider: 'oauth',
    };

    const organization = await deps.prisma.organization.upsert({
        where: { slug: config.platformOrgSlug },
        update: {
            name: config.platformOrgName,
            regionCode: config.platformRegionCode,
            tenantId: config.platformTenantId,
            status: OrganizationStatus.ACTIVE,
            complianceTier: ComplianceTier.GOV_SECURE,
            dataResidency: DataResidencyZone.UK_ONLY,
            dataClassification: DataClassificationLevel.OFFICIAL,
        },
        create: {
            slug: config.platformOrgSlug,
            name: config.platformOrgName,
            regionCode: config.platformRegionCode,
            tenantId: config.platformTenantId,
            status: OrganizationStatus.ACTIVE,
            complianceTier: ComplianceTier.GOV_SECURE,
            dataResidency: DataResidencyZone.UK_ONLY,
            dataClassification: DataClassificationLevel.OFFICIAL,
        },
        select: { id: true, slug: true, name: true, dataResidency: true, dataClassification: true },
    });

    assertUuid(organization.id, 'Organization id');

    const existingPolicies = await deps.abacPolicyRepository.getPoliciesForOrg(organization.id);
    if (existingPolicies.length === 0) {
        const authorization = buildAuthorizationContext({
            orgId: organization.id,
            userId,
            roleKey: config.roleName,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
            auditSource: BOOTSTRAP_SEED_SOURCE,
            tenantScope: {
                orgId: organization.id,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
                auditSource: BOOTSTRAP_SEED_SOURCE,
            },
        });
        await setAbacPolicies(
            { policyRepository: deps.abacPolicyRepository },
            { authorization, policies: DEFAULT_BOOTSTRAP_POLICIES },
        );
    }

    const permissions = resolveRoleTemplate(config.roleName).permissions as Record<string, string[]>;

    const role = await deps.prisma.role.upsert({
        where: { orgId_name: { orgId: organization.id, name: config.roleName } },
        update: {
            scope: RoleScope.GLOBAL,
            permissions: permissions as Prisma.InputJsonValue,
            inheritsRoleIds: [],
            isSystem: true,
            isDefault: true,
        },
        create: {
            orgId: organization.id,
            name: config.roleName,
            description: 'Platform administrator',
            scope: RoleScope.GLOBAL,
            permissions: permissions as Prisma.InputJsonValue,
            inheritsRoleIds: [],
            isSystem: true,
            isDefault: true,
        },
        select: { id: true, name: true },
    });

    const timestamp = new Date();

    await deps.prisma.membership.upsert({
        where: { orgId_userId: { orgId: organization.id, userId } },
        update: {
            roleId: role.id,
            status: MembershipStatus.ACTIVE,
            metadata: {
                ...superAdminMetadata,
                lastBootstrappedAt: timestamp.toISOString(),
            },
            activatedAt: timestamp,
            updatedBy: userId,
        },
        create: {
            orgId: organization.id,
            userId,
            roleId: role.id,
            status: MembershipStatus.ACTIVE,
            invitedBy: null,
            invitedAt: timestamp,
            activatedAt: timestamp,
            metadata: {
                ...superAdminMetadata,
                bootstrappedAt: timestamp.toISOString(),
            },
            createdBy: userId,
        },
    });

    await ensurePlatformAuthOrganization(deps.prisma, config, organization);

    const existingMember = await deps.prisma.authOrgMember.findFirst({
        where: { organizationId: organization.id, userId },
        select: { id: true },
    });

    if (existingMember) {
        await deps.prisma.authOrgMember.update({
            where: { id: existingMember.id },
            data: { role: config.roleName },
        });
    } else {
        await deps.prisma.authOrgMember.create({
            data: {
                id: randomUUID(),
                organizationId: organization.id,
                userId,
                role: config.roleName,
            },
        });
    }

    const { headers: setActiveHeaders } = await deps.auth.api.setActiveOrganization({
        headers: input.requestHeaders,
        body: { organizationId: organization.id },
        returnHeaders: true,
    });

    return {
        orgId: organization.id,
        role: config.roleName,
        redirectTo: '/dashboard',
        setActiveHeaders,
    };
}
