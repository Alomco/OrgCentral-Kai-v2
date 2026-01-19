import type { InvitationStatus as PrismaInvitationStatus } from '@/server/types/prisma';
import type { InvitationOnboardingData } from '@/server/invitations/onboarding-data';

export type InvitationStatus = PrismaInvitationStatus;

export type OnboardingData = InvitationOnboardingData;

export interface InvitationData {
    token: string;
    status: InvitationStatus;
    targetEmail: string;
    organizationId: string;
    organizationName: string;
    invitedByUid?: string;
    onboardingData: OnboardingData;
}
