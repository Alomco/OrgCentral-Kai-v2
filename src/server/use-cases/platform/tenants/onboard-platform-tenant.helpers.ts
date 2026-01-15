import { ValidationError } from '@/server/errors';
import { DEFAULT_BOOTSTRAP_POLICIES } from '@/server/security/abac-constants';
import { ROLE_TEMPLATES } from '@/server/security/role-templates';
import { TENANT_ROLE_KEYS } from '@/server/security/role-constants';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership/membership-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { MembershipStatus } from '@/server/types/prisma';
import { buildAuthorizationContext, generateEmployeeNumber } from '@/server/use-cases/shared/builders';
import type { Role } from '@/server/types/hr-types';
import type { OrganizationData } from '@/server/types/leave-types';
import type { OrgRoleKey } from '@/server/security/access-control';

export async function ensureBuiltinRoles(
    roleRepository: Pick<IRoleRepository, 'createRole' | 'updateRole' | 'getRolesByOrganization'>,
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

export async function ensureAbacPolicies(
    abacRepository: Pick<IAbacPolicyRepository, 'getPoliciesForOrg' | 'setPoliciesForOrg'>,
    orgId: string,
): Promise<void> {
    const existing = await abacRepository.getPoliciesForOrg(orgId);
    if (existing.length > 0) {
        return;
    }
    await abacRepository.setPoliciesForOrg(orgId, DEFAULT_BOOTSTRAP_POLICIES);
}

export function normalizeOwnerEmail(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        throw new ValidationError('Owner email is required to onboard a tenant.');
    }
    return trimmed;
}

export function normalizeOwnerDisplayName(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function linkOwnerMembership(
    membershipRepository: Pick<IMembershipRepository, 'createMembershipWithProfile'>,
    params: {
        authorization: RepositoryAuthorizationContext;
        organization: OrganizationData;
        ownerUserId: string;
        ownerEmail: string;
        displayName: string;
        ownerRoleName: OrgRoleKey;
        request?: {
            ipAddress?: string;
            userAgent?: string;
        };
    },
): Promise<void> {
    const ownerContext = buildAuthorizationContext({
        orgId: params.organization.id,
        userId: params.ownerUserId,
        roleKey: params.ownerRoleName,
        dataResidency: params.organization.dataResidency,
        dataClassification: params.organization.dataClassification,
        auditSource: params.authorization.auditSource,
        correlationId: params.authorization.correlationId,
        tenantScope: {
            orgId: params.organization.id,
            dataResidency: params.organization.dataResidency,
            dataClassification: params.organization.dataClassification,
            auditSource: params.authorization.auditSource,
            auditBatchId: params.authorization.auditBatchId,
        },
    });

    await membershipRepository.createMembershipWithProfile(ownerContext, {
        userId: params.ownerUserId,
        invitedByUserId: params.ownerUserId,
        roles: [params.ownerRoleName],
        profile: {
            orgId: params.organization.id,
            userId: params.ownerUserId,
            employeeNumber: generateEmployeeNumber(),
            metadata: {
                source: 'platform-onboarding',
                createdBy: params.authorization.userId,
                preboarding: false,
            },
        },
        userUpdate: {
            displayName: params.displayName,
            email: params.ownerEmail,
            status: MembershipStatus.ACTIVE,
        },
    });

    await recordAuditEvent({
        orgId: params.organization.id,
        userId: params.ownerUserId,
        eventType: 'SYSTEM',
        action: 'platform.tenant.onboarded',
        resource: 'platform.tenant',
        resourceId: params.organization.id,
        residencyZone: params.organization.dataResidency,
        classification: params.organization.dataClassification,
        auditSource: params.authorization.auditSource,
        correlationId: params.authorization.correlationId,
        payload: {
            ownerLinked: true,
            ipAddress: params.request?.ipAddress,
            userAgent: params.request?.userAgent,
        },
    });
}
