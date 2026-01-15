import { EntityNotFoundError } from '@/server/errors';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { organizationToTenantScope } from '@/server/security/guards';
import type { OrganizationData } from '@/server/types/leave-types';
import { assertEmailMatch, assertNotExpired, assertStatus, buildAuthorizationContext, normalizeRoles } from '@/server/use-cases/shared';

export async function resolveOrganization(
    organizationRepository: IOrganizationRepository | undefined,
    orgId: string,
): Promise<OrganizationData | null> {
    if (!organizationRepository) {
        return null;
    }
    return organizationRepository.getOrganization(orgId);
}

export function assertInvitationCanBeAccepted(
    record: InvitationRecord,
    actorEmail: string,
    token: string,
): void {
    assertStatus(record.status, 'pending', 'Invitation', { token });
    assertNotExpired(record.expiresAt, 'Invitation', { token });
    assertEmailMatch(
        actorEmail,
        record.targetEmail,
        'This invitation was issued to a different email address.',
    );
}

export function resolveInvitationRoles(record: InvitationRecord): string[] {
    return normalizeRoles(record.onboardingData.roles);
}

export async function buildMembershipContext(
    organizationRepository: IOrganizationRepository,
    orgId: string,
    userId: string,
): Promise<RepositoryAuthorizationContext> {
    const organization = await organizationRepository.getOrganization(orgId);
    if (!organization) {
        throw new EntityNotFoundError('Organization', { orgId });
    }
    return mapOrganizationToContext(organization, userId);
}

function mapOrganizationToContext(
    organization: OrganizationData,
    userId: string,
): RepositoryAuthorizationContext {
    const tenantScope = organizationToTenantScope(organization);
    return buildAuthorizationContext({
        orgId: organization.id,
        userId,
        dataResidency: tenantScope.dataResidency,
        dataClassification: tenantScope.dataClassification,
        auditSource: 'accept-invitation',
        tenantScope,
    });
}
