import type { JsonValue } from '@/server/types/hr/people';

export type OnboardingInvitationStatus = 'pending' | 'accepted' | 'expired' | 'declined' | 'revoked';

export interface OnboardingInvitationCreateInput {
  orgId: string;
  organizationName: string;
  targetEmail: string;
  invitedByUserId?: string | null;
  onboardingData: JsonValue;
  expiresAt?: Date | null;
  metadata?: JsonValue;
  securityContext?: JsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface OnboardingInvitation {
  token: string;
  orgId: string;
  organizationName: string;
  targetEmail: string;
  status: OnboardingInvitationStatus;
  invitedByUserId?: string | null;
  onboardingData: JsonValue;
  metadata?: JsonValue;
  securityContext?: JsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: Date | null;
  acceptedAt?: Date | null;
  acceptedByUserId?: string | null;
  revokedAt?: Date | null;
  revokedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOnboardingInvitationRepository {
  createInvitation(payload: OnboardingInvitationCreateInput): Promise<OnboardingInvitation>;
  listInvitationsByOrg(
    orgId: string,
    options?: { status?: OnboardingInvitationStatus; limit?: number },
  ): Promise<OnboardingInvitation[]>;
  getActiveInvitationByEmail(orgId: string, email: string): Promise<OnboardingInvitation | null>;
  getInvitationByToken(token: string): Promise<OnboardingInvitation | null>;
  markAccepted(orgId: string, token: string, acceptedByUserId: string): Promise<void>;
  revokeInvitation(orgId: string, token: string, revokedByUserId: string, reason?: string): Promise<void>;
}
