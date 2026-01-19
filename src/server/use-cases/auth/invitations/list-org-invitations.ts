import type { InvitationStatus } from '@/server/types/auth-types';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { hasOnboardingFingerprint, isJsonRecord } from '@/server/invitations/invitation-fingerprint';
import { getInvitationKind, INVITATION_KIND } from '@/server/invitations/invitation-kinds';
import { toInvitationJson } from '@/server/invitations/onboarding-data';
import type { JsonRecord, JsonValue } from '@/server/types/json';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations';

export interface ListOrgInvitationsDependencies {
    invitationRepository: IInvitationRepository;
}

export interface ListOrgInvitationsInput {
    authorization: RepositoryAuthorizationContext;
    status?: InvitationStatus;
    limit?: number;
}

export interface OrgInvitationSummary {
    token: string;
    targetEmail: string;
    status: InvitationStatus;
    invitedByUserId?: string;
    createdAt?: Date;
    expiresAt?: Date;
    roles: string[];
}

export interface ListOrgInvitationsResult {
    invitations: OrgInvitationSummary[];
}

export async function listOrgInvitations(
    deps: ListOrgInvitationsDependencies,
    input: ListOrgInvitationsInput,
): Promise<ListOrgInvitationsResult> {
    const records = await deps.invitationRepository.listInvitationsByOrg(input.authorization.orgId, {
        status: input.status,
        limit: input.limit,
    });

    const invitations = records
        .filter((record) => isOrgMemberInvitation(record))
        .map((record) => ({
            token: record.token,
            targetEmail: record.targetEmail,
            status: record.status,
            invitedByUserId: record.invitedByUserId ?? record.invitedByUid,
            createdAt: record.createdAt,
            expiresAt: record.expiresAt,
            roles: record.onboardingData.roles ?? [],
        }));

    return { invitations };
}

function isOrgMemberInvitation(record: InvitationRecord): boolean {
    const kind = getInvitationKind(toJsonRecord(record.metadata));
    if (kind) {
        return kind === INVITATION_KIND.ORG_MEMBER;
    }
    return !hasOnboardingFingerprint(toInvitationJson(record.onboardingData));
}

function toJsonRecord(value: JsonValue | null | undefined): JsonRecord | undefined {
    return isJsonRecord(value) ? value : undefined;
}
