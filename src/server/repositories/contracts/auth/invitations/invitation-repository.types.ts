import type { InvitationData, InvitationStatus } from '@/server/types/auth-types';
import type { Prisma } from '../../../../../generated/client';

export interface InvitationRecord extends InvitationData {
    invitedByUserId?: string;
    acceptedAt?: Date;
    acceptedByUserId?: string;
    revokedAt?: Date;
    revokedByUserId?: string;
    expiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    metadata?: Prisma.JsonValue | null;
}

export interface InvitationCreateInput {
    orgId: string;
    organizationName: string;
    targetEmail: string;
    invitedByUserId?: string;
    expiresAt?: Date;
    onboardingData: InvitationData['onboardingData'];
    metadata?: Prisma.JsonValue | null;
    securityContext?: Prisma.JsonValue | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface InvitationStatusUpdate {
    status: InvitationStatus;
    acceptedByUserId?: string;
    acceptedAt?: Date;
}
