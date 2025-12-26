import { MembershipStatus, RoleScope } from '@prisma/client';

import { AuthorizationError, ValidationError } from '@/server/errors';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { orgRoles, type OrgPermissionMap } from '@/server/security/access-control';
import type { OrganizationData } from '@/server/types/leave-types';
import type { Role } from '@/server/types/hr-types';
import { buildAuthorizationContext, generateEmployeeNumber } from '@/server/use-cases/shared/builders';

import { createOrganization } from './create-organization';

const OWNER_ROLE_NAME = 'owner';
const OWNER_ROLE_DESCRIPTION = 'Organization owner';

const OWNER_ROLE_PERMISSIONS = orgRoles.owner.statements as OrgPermissionMap;

export interface CreateOrganizationWithOwnerDependencies {
    organizationRepository: Pick<IOrganizationRepository, 'createOrganization'>;
    roleRepository: Pick<IRoleRepository, 'getRoleByName' | 'createRole'>;
    membershipRepository: Pick<IMembershipRepository, 'createMembershipWithProfile'>;
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

    await ensureOwnerRole(deps.roleRepository, organization.id);

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

async function ensureOwnerRole(
    roleRepository: CreateOrganizationWithOwnerDependencies['roleRepository'],
    orgId: string,
): Promise<void> {
    const existing = await roleRepository.getRoleByName(orgId, OWNER_ROLE_NAME);
    if (existing) {
        return;
    }

    await roleRepository.createRole(orgId, {
        orgId,
        name: OWNER_ROLE_NAME,
        description: OWNER_ROLE_DESCRIPTION,
        scope: RoleScope.ORG,
        permissions: OWNER_ROLE_PERMISSIONS as Role['permissions'],
    });
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
