import { AuthorizationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership/membership-repository-contract';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { CreateOrganizationInput } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { OrganizationData } from '@/server/types/leave-types';
import { buildAuthorizationContext, buildMetadata } from '@/server/use-cases/shared/builders';
import { INVITATION_KIND, withInvitationKind } from '@/server/invitations/invitation-kinds';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';
import { seedDefaultAbsenceTypes } from '@/server/use-cases/hr/absences/seed-default-absence-types';
import { createOrganization } from '@/server/use-cases/org/organization/create-organization';
import {
    ensureAbacPolicies,
    ensureBuiltinRoles,
    linkOwnerMembership,
    normalizeOwnerDisplayName,
    normalizeOwnerEmail,
} from './onboard-platform-tenant.helpers';

const OWNER_ROLE_NAME = 'owner';

export interface OnboardPlatformTenantDependencies {
    organizationRepository: Pick<IOrganizationRepository, 'createOrganization'>;
    roleRepository: Pick<IRoleRepository, 'createRole' | 'updateRole' | 'getRolesByOrganization'>;
    membershipRepository: Pick<IMembershipRepository, 'createMembershipWithProfile'>;
    invitationRepository: Pick<IInvitationRepository, 'createInvitation'>;
    abacPolicyRepository: Pick<IAbacPolicyRepository, 'getPoliciesForOrg' | 'setPoliciesForOrg'>;
    permissionResourceRepository: Pick<IPermissionResourceRepository, 'listResources' | 'createResource'>;
    absenceTypeConfigRepository: Pick<IAbsenceTypeConfigRepository, 'getConfigs' | 'createConfig'>;
}

export interface OnboardPlatformTenantInput {
    authorization: RepositoryAuthorizationContext;
    organization: Omit<CreateOrganizationInput, 'tenantId'>;
    owner: {
        email: string;
        displayName?: string | null;
        userId?: string | null;
    };
    request?: {
        ipAddress?: string;
        userAgent?: string;
        securityContext?: Record<string, unknown>;
    };
}

export interface OnboardPlatformTenantResult {
    organization: OrganizationData;
    invitationToken?: string;
    ownerUserId?: string;
}

export async function onboardPlatformTenant(
    deps: OnboardPlatformTenantDependencies,
    input: OnboardPlatformTenantInput,
): Promise<OnboardPlatformTenantResult> {
    const normalizedEmail = normalizeOwnerEmail(input.owner.email);

    if (input.authorization.orgId !== input.authorization.tenantScope.orgId) {
        throw new AuthorizationError('Tenant onboarding requires a platform-scoped session.');
    }

    const { organization } = await createOrganization(
        { organizationRepository: deps.organizationRepository },
        {
            authorization: input.authorization,
            organization: {
                ...input.organization,
                tenantId: input.authorization.orgId,
            },
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
            authorization: buildAuthorizationContext({
                orgId: organization.id,
                userId: input.authorization.userId,
                roleKey: OWNER_ROLE_NAME,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
                auditSource: input.authorization.auditSource,
                correlationId: input.authorization.correlationId,
                tenantScope: {
                    orgId: organization.id,
                    dataResidency: organization.dataResidency,
                    dataClassification: organization.dataClassification,
                    auditSource: input.authorization.auditSource,
                    auditBatchId: input.authorization.auditBatchId,
                },
            }),
            dataResidency: organization.dataResidency,
            dataClassification: organization.dataClassification,
        },
    );

    const ownerUserId = input.owner.userId?.trim();
    const displayName = normalizeOwnerDisplayName(input.owner.displayName) ?? normalizedEmail;

    if (ownerUserId && ownerUserId === input.authorization.userId) {
        await linkOwnerMembership(deps.membershipRepository, {
            authorization: input.authorization,
            organization,
            ownerUserId,
            ownerEmail: normalizedEmail,
            displayName,
            ownerRoleName: OWNER_ROLE_NAME,
            request: input.request,
        });

        return { organization, ownerUserId };
    }

    const invitation = await deps.invitationRepository.createInvitation({
        orgId: organization.id,
        organizationName: organization.name,
        targetEmail: normalizedEmail,
        invitedByUserId: input.authorization.userId,
        onboardingData: {
            email: normalizedEmail,
            displayName,
            roles: [OWNER_ROLE_NAME],
        },
        metadata: withInvitationKind(
            buildMetadata({
                auditSource: input.authorization.auditSource,
                correlationId: input.authorization.correlationId,
                dataResidency: organization.dataResidency,
                dataClassification: organization.dataClassification,
                ownerUserId: ownerUserId ?? null,
            }),
            INVITATION_KIND.PLATFORM_OWNER,
        ),
        securityContext: input.request?.securityContext
            ? buildMetadata(input.request.securityContext)
            : undefined,
        ipAddress: input.request?.ipAddress,
        userAgent: input.request?.userAgent,
    });

    await recordAuditEvent({
        orgId: organization.id,
        userId: input.authorization.userId,
        eventType: 'SYSTEM',
        action: 'platform.tenant.invited',
        resource: 'platform.tenant',
        resourceId: organization.id,
        residencyZone: organization.dataResidency,
        classification: organization.dataClassification,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        payload: {
            invitationIssued: true,
            ipAddress: input.request?.ipAddress,
            userAgent: input.request?.userAgent,
        },
    });

    return {
        organization,
        invitationToken: invitation.token,
        ownerUserId: ownerUserId ?? undefined,
    };
}

