import { cva, type VariantProps } from 'class-variance-authority';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_BLUE = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
const STATUS_GREEN = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
const STATUS_GRAY = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
const STATUS_YELLOW = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
const STATUS_RED = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

/** CVA-based status badge variants for HR module consistency. */
const hrStatusBadgeVariants = cva('', {
    variants: {
        status: {
            // Absence statuses
            REPORTED: STATUS_YELLOW,
            APPROVED: STATUS_GREEN,
            REJECTED: STATUS_RED,
            CANCELLED: STATUS_GRAY,
            CLOSED: STATUS_BLUE,
            // Time tracking statuses
            ACTIVE: STATUS_BLUE,
            COMPLETED: STATUS_GREEN,
            // Training statuses
            ENROLLED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            PASSED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            // Performance statuses
            DRAFT: STATUS_GRAY,
            PENDING_REVIEW: STATUS_YELLOW,
            SUBMITTED: STATUS_BLUE,
            FINALIZED: STATUS_GREEN,
            // Generic fallback
            default: '',
        },
    },
    defaultVariants: {
        status: 'default',
    },
});

export type HrStatusBadgeStatus = NonNullable<VariantProps<typeof hrStatusBadgeVariants>['status']>;

export interface HrStatusBadgeProps {
    status: string;
    label?: string;
    className?: string;
}

/** Type-safe status badge with CVA variants for all HR module statuses. */
export function HrStatusBadge({ status, label, className }: HrStatusBadgeProps) {
    const normalizedStatus = status.toUpperCase().replace(/[- ]/g, '_') as HrStatusBadgeStatus;
    const displayLabel = label ?? status.replace(/_/g, ' ');

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium capitalize transition-colors motion-reduce:transition-none',
                hrStatusBadgeVariants({ status: normalizedStatus }),
                className,
            )}
        >
            {displayLabel}
        </Badge>
    );
}
