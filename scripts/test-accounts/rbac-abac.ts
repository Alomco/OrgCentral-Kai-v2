import { ComplianceTier, OrganizationStatus, type PrismaClient } from '@prisma/client';
import { buildAuthorizationContext } from '@/server/use-cases/shared/builders';
import type { Role } from '@/server/types/hr-types';
import { ensureAbacPolicies, ensureBuiltinRoles } from '@/server/use-cases/org/organization/organization-bootstrap';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';
import { seedDefaultAbsenceTypes } from '@/server/use-cases/hr/absences/seed-default-absence-types';
import { updateOrgSettings } from '@/server/services/org/settings/org-settings-store';
import { defaultOrgSettings } from '@/server/services/org/settings/org-settings-model';
import { resolveRoleTemplate } from '@/server/security/role-templates';
import { buildAbacPolicyServiceDependencies } from '@/server/repositories/providers/org/abac-policy-service-dependencies';
import { buildPermissionResourceServiceDependencies } from '@/server/repositories/providers/org/permission-resource-service-dependencies';
import { buildRoleServiceDependencies } from '@/server/repositories/providers/org/role-service-dependencies';
import { buildAbsenceTypeConfigDependencies } from '@/server/repositories/providers/hr/absence-type-config-service-dependencies';
import { ORGANIZATION_SEEDS } from './personas';
import type {
    OrganizationKey,
    SeededOrgRecord,
} from './types';

interface ActorContext {
    userId: string;
    roleKey: 'globalAdmin' | 'owner';
}

type ActorMap = Record<OrganizationKey, ActorContext>;
type OrgMap = Record<OrganizationKey, SeededOrgRecord>;

export async function ensureOrganizations(prisma: PrismaClient): Promise<OrgMap> {
    const records = {} as OrgMap;
    const platformSeed = ORGANIZATION_SEEDS.find((seed) => seed.key === 'platform');
    if (!platformSeed) {
        throw new Error('Platform organization seed is missing.');
    }

    const platform = await prisma.organization.upsert({
        where: { slug: platformSeed.slug },
        update: {
            name: platformSeed.name,
            tenantId: platformSeed.tenantId,
            regionCode: platformSeed.regionCode,
            status: OrganizationStatus.ACTIVE,
            complianceTier: ComplianceTier.GOV_SECURE,
            dataResidency: platformSeed.dataResidency,
            dataClassification: platformSeed.dataClassification,
        },
        create: {
            slug: platformSeed.slug,
            name: platformSeed.name,
            tenantId: platformSeed.tenantId,
            regionCode: platformSeed.regionCode,
            status: OrganizationStatus.ACTIVE,
            complianceTier: ComplianceTier.GOV_SECURE,
            dataResidency: platformSeed.dataResidency,
            dataClassification: platformSeed.dataClassification,
            settings: {},
        },
    });

    records.platform = {
        key: 'platform',
        id: platform.id,
        slug: platform.slug,
        name: platform.name,
        dataResidency: platform.dataResidency,
        dataClassification: platform.dataClassification,
    };

    for (const seed of ORGANIZATION_SEEDS.filter((candidate) => candidate.key !== 'platform')) {
        const organization = await prisma.organization.upsert({
            where: { slug: seed.slug },
            update: {
                name: seed.name,
                tenantId: records.platform.id,
                regionCode: seed.regionCode,
                status: OrganizationStatus.ACTIVE,
                complianceTier: ComplianceTier.GOV_SECURE,
                dataResidency: seed.dataResidency,
                dataClassification: seed.dataClassification,
            },
            create: {
                slug: seed.slug,
                name: seed.name,
                tenantId: records.platform.id,
                regionCode: seed.regionCode,
                status: OrganizationStatus.ACTIVE,
                complianceTier: ComplianceTier.GOV_SECURE,
                dataResidency: seed.dataResidency,
                dataClassification: seed.dataClassification,
                settings: {},
            },
        });

        records[seed.key] = {
            key: seed.key,
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
        };
    }

    return records;
}

export async function seedRbacAbacFoundations(orgs: OrgMap): Promise<void> {
    const { roleRepository } = buildRoleServiceDependencies();
    const { permissionRepository } = buildPermissionResourceServiceDependencies();
    const { abacPolicyRepository } = buildAbacPolicyServiceDependencies();

    for (const organization of Object.values(orgs)) {
        await ensureBuiltinRoles(roleRepository, organization.id);
        await ensureGlobalAdminRole(roleRepository, organization.id);
        await seedPermissionResources(
            { permissionResourceRepository: permissionRepository },
            { orgId: organization.id },
        );
        await ensureAbacPolicies(abacPolicyRepository, organization.id);
    }
}

export async function applyOrgSecurityAndAbsenceDefaults(
    orgs: OrgMap,
    actors: ActorMap,
): Promise<void> {
    const { absenceTypeConfigRepository } = buildAbsenceTypeConfigDependencies();

    for (const seed of ORGANIZATION_SEEDS) {
        const organization = orgs[seed.key];
        const actor = actors[seed.key];
        const authorization = buildAuthorizationContext({
            orgId: organization.id,
            userId: actor.userId,
            roleKey: actor.roleKey,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
            auditSource: 'scripts/seed-test-accounts',
            tenantScope: {
                orgId: organization.id,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
                auditSource: 'scripts/seed-test-accounts',
            },
        });

        await updateOrgSettings(authorization, {
            security: {
                sessionTimeoutMinutes: defaultOrgSettings.security.sessionTimeoutMinutes,
                ipAllowlistEnabled: defaultOrgSettings.security.ipAllowlistEnabled,
                ipAllowlist: defaultOrgSettings.security.ipAllowlist,
                mfaRequired: seed.mfaRequired,
            },
        });

        await seedDefaultAbsenceTypes(
            { typeConfigRepository: absenceTypeConfigRepository },
            { authorization },
        );
    }
}

async function ensureGlobalAdminRole(
    roleRepository: ReturnType<typeof buildRoleServiceDependencies>['roleRepository'],
    orgId: string,
): Promise<void> {
    const template = resolveRoleTemplate('globalAdmin');
    const existing = await roleRepository.getRoleByName(orgId, template.name);

    const payload = {
        description: template.description,
        scope: template.scope,
        permissions: template.permissions as Role['permissions'],
        isSystem: template.isSystem ?? true,
        isDefault: template.isDefault ?? false,
    };

    if (existing) {
        await roleRepository.updateRole(orgId, existing.id, payload);
        return;
    }

    await roleRepository.createRole(orgId, {
        orgId,
        name: template.name,
        description: payload.description,
        scope: payload.scope,
        permissions: payload.permissions,
        inheritsRoleIds: [],
        isSystem: payload.isSystem,
        isDefault: payload.isDefault,
    });
}
