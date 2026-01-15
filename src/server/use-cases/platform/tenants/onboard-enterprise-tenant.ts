import { AuthorizationError, ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEnterpriseAdminRepository } from '@/server/repositories/contracts/org/enterprise/enterprise-admin-repository-contract';
import type { CreateOrganizationInput } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { ManagedOrganizationSummary } from '@/server/types/enterprise-types';
import type { OrganizationData } from '@/server/types/leave-types';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import {
    CACHE_SCOPE_ABAC_POLICIES,
    CACHE_SCOPE_ENTERPRISE_MANAGED_ORGS,
    CACHE_SCOPE_ONBOARDING_INVITATIONS,
    CACHE_SCOPE_PERMISSIONS,
    CACHE_SCOPE_ROLES,
} from '@/server/repositories/cache-scopes';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import {
    onboardPlatformTenant,
    type OnboardPlatformTenantDependencies,
    type OnboardPlatformTenantInput,
} from './onboard-platform-tenant';

const CLASSIFICATION_RANK: Record<DataClassificationLevel, number> = {
    OFFICIAL: 1,
    OFFICIAL_SENSITIVE: 2,
    SECRET: 3,
    TOP_SECRET: 4,
};

export interface OnboardEnterpriseTenantDependencies extends OnboardPlatformTenantDependencies {
    enterpriseAdminRepository: Pick<IEnterpriseAdminRepository, 'onboardOrganization'>;
}

export interface OnboardEnterpriseTenantInput {
    authorization: RepositoryAuthorizationContext;
    organization: Omit<CreateOrganizationInput, 'tenantId'> & {
        dataResidency: DataResidencyZone;
        dataClassification: DataClassificationLevel;
    };
    owner: OnboardPlatformTenantInput['owner'];
    planId: string;
    moduleAccess: Record<string, boolean>;
    request?: OnboardPlatformTenantInput['request'];
}

export interface OnboardEnterpriseTenantResult {
    organization: OrganizationData;
    managedOrganization: ManagedOrganizationSummary;
    invitationToken?: string;
    ownerUserId?: string;
}

export async function onboardEnterpriseTenant(
    deps: OnboardEnterpriseTenantDependencies,
    input: OnboardEnterpriseTenantInput,
): Promise<OnboardEnterpriseTenantResult> {
    assertTenantConstraints(
        input.authorization,
        input.organization.dataResidency,
        input.organization.dataClassification,
    );

    const platformResult = await onboardPlatformTenant(
        {
            organizationRepository: deps.organizationRepository,
            roleRepository: deps.roleRepository,
            membershipRepository: deps.membershipRepository,
            invitationRepository: deps.invitationRepository,
            abacPolicyRepository: deps.abacPolicyRepository,
            permissionResourceRepository: deps.permissionResourceRepository,
            absenceTypeConfigRepository: deps.absenceTypeConfigRepository,
        },
        {
            authorization: input.authorization,
            organization: input.organization,
            owner: input.owner,
            request: input.request,
        },
    );

    const managedOrganization = await deps.enterpriseAdminRepository.onboardOrganization({
        adminUserId: input.authorization.userId,
        orgId: platformResult.organization.id,
        orgName: platformResult.organization.name,
        ownerEmail: normalizeEmail(input.owner.email),
        planId: input.planId,
        moduleAccess: input.moduleAccess,
    });

    await invalidateEnterpriseScopes(platformResult.organization);

    await recordAuditEvent({
        orgId: platformResult.organization.id,
        userId: input.authorization.userId,
        eventType: 'SYSTEM',
        action: 'enterprise.tenant.onboarded',
        resource: 'enterprise.tenant',
        resourceId: platformResult.organization.id,
        residencyZone: platformResult.organization.dataResidency,
        classification: platformResult.organization.dataClassification,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        payload: {
            managedOrganizationId: managedOrganization.orgId,
            invitationIssued: Boolean(platformResult.invitationToken),
        },
    });

    return {
        organization: platformResult.organization,
        managedOrganization,
        invitationToken: platformResult.invitationToken,
        ownerUserId: platformResult.ownerUserId,
    };
}

async function invalidateEnterpriseScopes(organization: OrganizationData): Promise<void> {
    const scopes = [
        CACHE_SCOPE_ROLES,
        CACHE_SCOPE_PERMISSIONS,
        CACHE_SCOPE_ABAC_POLICIES,
        CACHE_SCOPE_ONBOARDING_INVITATIONS,
        CACHE_SCOPE_ENTERPRISE_MANAGED_ORGS,
    ];

    for (const scope of scopes) {
        await invalidateOrgCache(
            organization.id,
            scope,
            organization.dataClassification,
            organization.dataResidency,
        );
    }
}

function assertTenantConstraints(
    authorization: RepositoryAuthorizationContext,
    residency: DataResidencyZone,
    classification: DataClassificationLevel,
): void {
    if (authorization.dataResidency !== residency) {
        throw new AuthorizationError('Requested residency zone mismatch.');
    }

    if (CLASSIFICATION_RANK[authorization.dataClassification] < CLASSIFICATION_RANK[classification]) {
        throw new AuthorizationError('Requested classification exceeds clearance.');
    }
}

function normalizeEmail(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        throw new ValidationError('Owner email is required to onboard a tenant.');
    }
    return trimmed;
}
