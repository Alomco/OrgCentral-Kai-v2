import { createInvitationRepository } from '@/server/repositories/providers/auth/invitation-repository-provider';
import { listOrgInvitations } from '@/server/use-cases/auth/invitations/list-org-invitations';
import { revokeOrgInvitation } from '@/server/use-cases/auth/invitations/revoke-org-invitation';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getInvitationEmailDependencies } from '@/server/use-cases/notifications/invitation-email.provider';
import { resendInvitationEmail } from '@/server/use-cases/notifications/resend-invitation-email';
import type { InvitationStatus } from '@/server/types/auth-types';
import { EntityNotFoundError } from '@/server/errors';
import { hasOnboardingFingerprint, isJsonRecord } from '@/server/invitations/invitation-fingerprint';
import { getInvitationKind, INVITATION_KIND } from '@/server/invitations/invitation-kinds';
import { toInvitationJson } from '@/server/invitations/onboarding-data';
import type { JsonRecord, JsonValue } from '@/server/types/json';

export async function listInvitations(
    authorization: RepositoryAuthorizationContext,
    status?: InvitationStatus,
    limit?: number,
) {
    const invitationRepository = createInvitationRepository();
    return listOrgInvitations({ invitationRepository }, { authorization, status, limit });
}

export async function revokeInvitation(
    authorization: RepositoryAuthorizationContext,
    token: string,
    reason?: string,
) {
    const invitationRepository = createInvitationRepository();
    return revokeOrgInvitation({ invitationRepository }, { authorization, token, reason });
}

export async function resendInvitation(
    authorization: RepositoryAuthorizationContext,
    token: string,
) {
    const dependencies = getInvitationEmailDependencies();
    await assertOrgMemberInvitation(
        dependencies.invitationRepository,
        authorization.orgId,
        token,
    );
    return resendInvitationEmail(dependencies, { authorization, invitationToken: token });
}

async function assertOrgMemberInvitation(
    repository: ReturnType<typeof createInvitationRepository>,
    orgId: string,
    token: string,
): Promise<void> {
    const record = await repository.findByToken(token);
    if (record?.organizationId !== orgId) {
        throw new EntityNotFoundError('Invitation', { token, orgId });
    }
    const kind = getInvitationKind(toJsonRecord(record.metadata));
    if (kind && kind !== INVITATION_KIND.ORG_MEMBER) {
        throw new EntityNotFoundError('Invitation', { token, orgId });
    }
    if (!kind && hasOnboardingFingerprint(toInvitationJson(record.onboardingData))) {
        throw new EntityNotFoundError('Invitation', { token, orgId });
    }
}

function toJsonRecord(value: JsonValue | null | undefined): JsonRecord | undefined {
    return isJsonRecord(value) ? value : undefined;
}
