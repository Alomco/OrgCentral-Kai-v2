import { MembershipStatus } from '@prisma/client';

import { AuthorizationError, ValidationError } from '@/server/errors';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { ROLE_TEMPLATES } from '@/server/security/role-templates';
import { TENANT_ROLE_KEYS } from '@/server/security/role-constants';
import { DEFAULT_BOOTSTRAP_POLICIES } from '@/server/security/abac-constants';
import type { OrganizationData } from '@/server/types/leave-types';
import type { Role } from '@/server/types/hr-types';
import { buildAuthorizationContext, generateEmployeeNumber } from '@/server/use-cases/shared/builders';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';
import { seedDefaultAbsenceTypes } from '@/server/use-cases/hr/absences/seed-default-absence-types';

import { createOrganization } from './create-organization';

const OWNER_ROLE_NAME = 'owner';

export interface CreateOrganizationWithOwnerDependencies {
    organizationRepository: Pick<IOrganizationRepository, 'createOrganization'>;
    roleRepository: Pick<IRoleRepository, 'createRole' | 'updateRole' | 'getRolesByOrganization'>;
    membershipRepository: Pick<IMembershipRepository, 'createMembershipWithProfile'>;
    abacPolicyRepository: Pick<IAbacPolicyRepository, 'getPoliciesForOrg' | 'setPoliciesForOrg'>;
    permissionResourceRepository: Pick<IPermissionResourceRepository, 'listResources' | 'createResource'>;
    absenceTypeConfigRepository: Pick<IAbsenceTypeConfigRepository, 'getConfigs' | 'createConfig'>;
}

export interface CreateOrganizationWithOwnerInput {
    authorization: RepositoryAuthorizationContext;
    actor: {
        userId: string;
        email: string;
        displayName?: string | null;
    };
    organization: Parameters<typeof createOrganization>[1]['organization'];
}

export interface CreateOrganizationWithOwnerResult {
    organization: OrganizationData;
}

export async function createOrganizationWithOwner(
    deps: CreateOrganizationWithOwnerDependencies,
    input: CreateOrganizationWithOwnerInput,
): Promise<CreateOrganizationWithOwnerResult> {
    const normalizedEmail = normalizeEmail(input.actor.email);
    const normalizedDisplayName = normalizeDisplayName(input.actor.displayName);
    if (input.actor.userId !== input.authorization.userId) {
        throw new AuthorizationError('Organization creator must match the authenticated user.');
    }

    const { organization } = await createOrganization(
        { organizationRepository: deps.organizationRepository },
        {
            authorization: input.authorization,
            organization: input.organization,
        },
    );

    await ensureBuiltinRoles(deps.roleRepository, organization.id);
    await ensureAbacPolicies(deps.abacPolicyRepository, organization.id);
    await seedPermissionResources(
        { permissionResourceRepository: deps.permissionResourceRepository },
        { orgId: organization.id },
    );
    await seedDefaultAbsenceTypes(
        { typeConfigRepository: deps.absenceTypeConfigRepository },
        {
            orgId: organization.id,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
        },
    );

    const ownerContext = buildOwnerContext(organization, input.authorization, input.actor.userId);

    await deps.membershipRepository.createMembershipWithProfile(ownerContext, {
        userId: input.actor.userId,
        invitedByUserId: input.actor.userId,
        roles: [OWNER_ROLE_NAME],
        profile: {
            orgId: organization.id,
            userId: input.actor.userId,
            employeeNumber: generateEmployeeNumber(),
            metadata: {
                source: 'org-create',
                createdBy: input.actor.userId,
            },
        },
        userUpdate: {
            ...(normalizedDisplayName ? { displayName: normalizedDisplayName } : {}),
            email: normalizedEmail,
            status: MembershipStatus.ACTIVE,
        },
    });

    return { organization };
}

async function ensureBuiltinRoles(
    roleRepository: CreateOrganizationWithOwnerDependencies['roleRepository'],
    orgId: string,
): Promise<void> {
    const existing = await roleRepository.getRolesByOrganization(orgId);
    const byName = new Map(existing.map((role) => [role.name, role]));

    for (const roleKey of TENANT_ROLE_KEYS) {
        const template = ROLE_TEMPLATES[roleKey];
        if (byName.has(template.name)) {
            continue;
        }
        await roleRepository.createRole(orgId, {
            orgId,
            name: template.name,
            description: template.description,
            scope: template.scope,
            permissions: template.permissions as Role['permissions'],
            inheritsRoleIds: [],
            isSystem: template.isSystem ?? false,
            isDefault: template.isDefault ?? false,
        });
    }

    const refreshed = await roleRepository.getRolesByOrganization(orgId);
    const refreshedByName = new Map(refreshed.map((role) => [role.name, role]));

    for (const roleKey of TENANT_ROLE_KEYS) {
        const template = ROLE_TEMPLATES[roleKey];
        const role = refreshedByName.get(template.name);
        if (!role || !template.inherits?.length) {
            continue;
        }
        const inheritedRoleIds = template.inherits
            .map((name) => refreshedByName.get(name)?.id)
            .filter((id): id is string => typeof id === 'string');
        await roleRepository.updateRole(orgId, role.id, { inheritsRoleIds: inheritedRoleIds });
    }
}

async function ensureAbacPolicies(
    abacRepository: CreateOrganizationWithOwnerDependencies['abacPolicyRepository'],
    orgId: string,
): Promise<void> {
    const existing = await abacRepository.getPoliciesForOrg(orgId);
    if (existing.length > 0) {
        return;
    }
    await abacRepository.setPoliciesForOrg(orgId, DEFAULT_BOOTSTRAP_POLICIES);
}

function buildOwnerContext(
    organization: OrganizationData,
    authorization: RepositoryAuthorizationContext,
    userId: string,
): RepositoryAuthorizationContext {
    const auditSource = authorization.auditSource;
    const auditBatchId = authorization.auditBatchId;
    return buildAuthorizationContext({
        orgId: organization.id,
        userId,
        roleKey: 'owner',
        dataResidency: organization.dataResidency,
        dataClassification: organization.dataClassification,
        auditSource,
        auditBatchId,
        correlationId: authorization.correlationId,
        tenantScope: {
            orgId: organization.id,
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
            auditSource,
            auditBatchId,
        },
    });
}

function normalizeEmail(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        throw new ValidationError('Creator email is required to provision organization.');
    }
    return trimmed;
}

function normalizeDisplayName(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
