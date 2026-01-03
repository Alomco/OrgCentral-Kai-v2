/**
 * Absence Status Badge Variants
 * Single Responsibility: Map absence statuses to badge variants
 */

import type { BadgeVariant } from '@/components/ui/badge';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';

type AbsenceStatus = UnplannedAbsence['status'];

const statusVariantMap: Record<AbsenceStatus, BadgeVariant> = {
    REPORTED: 'secondary',
    APPROVED: 'default',
    REJECTED: 'destructive',
    CANCELLED: 'outline',
    CLOSED: 'outline',
};

export function absenceStatusBadgeVariant(status: AbsenceStatus): BadgeVariant {
    return statusVariantMap[status];
}
