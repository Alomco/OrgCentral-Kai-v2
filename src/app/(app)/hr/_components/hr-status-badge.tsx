import { cva, type VariantProps } from 'class-variance-authority';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_INFO = 'bg-primary/10 text-primary';
const STATUS_SUCCESS = 'bg-accent/15 text-foreground';
const STATUS_NEUTRAL = 'bg-muted/60 text-muted-foreground';
const STATUS_WARNING = 'bg-secondary/70 text-secondary-foreground';
const STATUS_ERROR = 'bg-destructive/10 text-destructive';

/** CVA-based status badge variants for HR module consistency. */
const hrStatusBadgeVariants = cva('', {
    variants: {
        status: {
            // Absence statuses
            REPORTED: STATUS_WARNING,
            APPROVED: STATUS_SUCCESS,
            REJECTED: STATUS_ERROR,
            CANCELLED: STATUS_NEUTRAL,
            CLOSED: STATUS_INFO,
            // Time tracking statuses
            ACTIVE: STATUS_INFO,
            COMPLETED: STATUS_SUCCESS,
            // Training statuses
            ENROLLED: STATUS_WARNING,
            IN_PROGRESS: STATUS_INFO,
            PASSED: STATUS_SUCCESS,
            FAILED: STATUS_ERROR,
            EXPIRED: STATUS_NEUTRAL,
            // Performance statuses
            DRAFT: STATUS_NEUTRAL,
            PENDING_REVIEW: STATUS_WARNING,
            SUBMITTED: STATUS_INFO,
            FINALIZED: STATUS_SUCCESS,
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
