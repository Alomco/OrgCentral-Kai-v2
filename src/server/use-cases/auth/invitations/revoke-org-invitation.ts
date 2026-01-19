import type { IInvitationRepository, InvitationRecord } from '@/server/repositories/contracts/auth/invitations';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { EntityNotFoundError } from '@/server/errors';
import { normalizeToken } from '@/server/use-cases/shared';
import { hasOnboardingFingerprint, isJsonRecord } from '@/server/invitations/invitation-fingerprint';
import { getInvitationKind, INVITATION_KIND } from '@/server/invitations/invitation-kinds';
import { toInvitationJson } from '@/server/invitations/onboarding-data';
import type { JsonRecord, JsonValue } from '@/server/types/json';

export interface RevokeOrgInvitationDependencies {
    invitationRepository: IInvitationRepository;
}

export interface RevokeOrgInvitationInput {
    authorization: RepositoryAuthorizationContext;
    token: string;
    reason?: string;
}

export interface RevokeOrgInvitationResult {
    success: true;
}

export async function revokeOrgInvitation(
    deps: RevokeOrgInvitationDependencies,
    input: RevokeOrgInvitationInput,
): Promise<RevokeOrgInvitationResult> {
    const token = normalizeToken(input.token);
    const reason = input.reason?.trim();

    const invitation = await assertOrgMemberInvitation(
        deps.invitationRepository,
        input.authorization.orgId,
        token,
    );

    await deps.invitationRepository.revokeInvitation(
        input.authorization.orgId,
        invitation.token,
        input.authorization.userId,
        reason,
    );

    return { success: true };
}

async function assertOrgMemberInvitation(
    repository: IInvitationRepository,
    orgId: string,
    token: string,
): Promise<InvitationRecord> {
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

    return record;
}

function toJsonRecord(value: JsonValue | null | undefined): JsonRecord | undefined {
    return isJsonRecord(value) ? value : undefined;
}
