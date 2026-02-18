import { EntityNotFoundError } from '@/server/errors';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { InvitationStatus, OnboardingData } from '@/server/types/auth-types';
import { normalizeToken, assertStatus, assertNotExpired } from '@/server/use-cases/shared';

export interface GetInvitationDetailsDependencies {
    invitationRepository: IInvitationRepository;
    userRepository?: Pick<IUserRepository, 'userExistsByEmail'>;
}

export interface GetInvitationDetailsInput {
    token: string;
}

export interface InvitationDetails {
    token: string;
    organizationId: string;
    organizationName: string;
    status: InvitationStatus;
    email: string;
    expiresAt?: Date | null;
    onboardingData: OnboardingData;
    invitedByUserId?: string;
    acceptedAt?: Date;
    acceptedByUserId?: string;
}

export interface GetInvitationDetailsResult {
    invitation: InvitationDetails;
    isExistingUser: boolean;
}

export async function getInvitationDetails(
    deps: GetInvitationDetailsDependencies,
    input: GetInvitationDetailsInput,
): Promise<GetInvitationDetailsResult> {
    const token = normalizeToken(input.token);
    const tokenContext = buildTokenErrorContext(token);

    const record = await deps.invitationRepository.findByToken(token);
    if (!record) {
        throw new EntityNotFoundError('Invitation', tokenContext);
    }

    assertInvitationActive(record, tokenContext);

    const isExistingUser = deps.userRepository
        ? await deps.userRepository.userExistsByEmail(record.targetEmail)
        : false;

    return {
        invitation: mapInvitationRecord(record),
        isExistingUser,
    };
}

function mapInvitationRecord(record: InvitationRecord): InvitationDetails {
    return {
        token: record.token,
        organizationId: record.organizationId,
        organizationName: record.organizationName,
        status: record.status,
        email: record.targetEmail,
        expiresAt: record.expiresAt ?? null,
        onboardingData: record.onboardingData,
        invitedByUserId: record.invitedByUserId ?? record.invitedByUid,
        acceptedAt: record.acceptedAt,
        acceptedByUserId: record.acceptedByUserId,
    };
}

function assertInvitationActive(record: InvitationRecord, tokenContext: { tokenLength: number }): void {
    assertStatus(record.status, 'pending', 'Invitation', tokenContext);
    assertNotExpired(record.expiresAt, 'Invitation', tokenContext);
}

function buildTokenErrorContext(token: string): { tokenLength: number } {
    return { tokenLength: token.length };
}
