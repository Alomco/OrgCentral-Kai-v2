import type { BadgeVariant } from '@/components/ui/badge';
import type { OnboardingInvitationStatus } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { ComplianceItemStatus } from '@/server/types/compliance-types';
import type { LeaveRequest } from '@/server/types/leave-types';

export type HrBadgeVariant = BadgeVariant;

export function leaveRequestStatusBadgeVariant(status: LeaveRequest['status']): HrBadgeVariant {
    switch (status) {
        case 'submitted':
            return 'default';
        case 'approved':
            return 'secondary';
        case 'rejected':
            return 'destructive';
        case 'cancelled':
            return 'outline';
    }
}

export function onboardingInvitationStatusBadgeVariant(status: OnboardingInvitationStatus): HrBadgeVariant {
    switch (status) {
        case 'pending':
            return 'secondary';
        case 'accepted':
            return 'default';
        case 'expired':
            return 'outline';
        case 'declined':
            return 'outline';
        case 'revoked':
            return 'destructive';
    }
}

export function complianceItemStatusBadgeVariant(status: ComplianceItemStatus): HrBadgeVariant {
    switch (status) {
        case 'PENDING':
            return 'secondary';
        case 'PENDING_REVIEW':
            return 'secondary';
        case 'COMPLETE':
            return 'default';
        case 'MISSING':
            return 'destructive';
        case 'EXPIRED':
            return 'destructive';
        case 'NOT_APPLICABLE':
            return 'outline';
    }
}
