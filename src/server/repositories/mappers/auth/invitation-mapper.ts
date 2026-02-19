import type { Invitation as PrismaInvitation } from '../../../../generated/client';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations';
import { coerceOnboardingData } from '@/server/invitations/onboarding-data';

export function mapPrismaInvitationToInvitationRecord(
    record: PrismaInvitation,
): InvitationRecord {
    return {
        token: record.token,
        status: record.status,
        targetEmail: record.targetEmail,
        organizationId: record.orgId,
        organizationName: record.organizationName,
        invitedByUid: record.invitedByUserId ?? undefined,
        onboardingData: coerceOnboardingData(record.onboardingData, record.targetEmail),
        invitedByUserId: record.invitedByUserId ?? undefined,
        acceptedAt: record.acceptedAt ?? undefined,
        acceptedByUserId: record.acceptedByUserId ?? undefined,
        revokedAt: record.revokedAt ?? undefined,
        revokedByUserId: record.revokedByUserId ?? undefined,
        expiresAt: record.expiresAt ?? undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        metadata: record.metadata ?? null,
    };
}
