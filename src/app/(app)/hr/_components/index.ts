// HR Reusable Components
export { HrCardSkeleton, type HrCardSkeletonProps } from './hr-card-skeleton';
export { HrDataTable, type HrDataTableProps, type HrDataTableColumn } from './hr-data-table';
export { HrPageHeader, type HrPageHeaderProps } from './hr-page-header';
export { HrStatusBadge, type HrStatusBadgeProps, type HrStatusBadgeStatus } from './hr-status-badge';

// 🎨 HR Design System - Futuristic components with "interface locking"
export {
    HrGlassCard,
    HrGradientHeader,
    HrStatusIndicator,
    HrGradientButton,
    HrStatCard,
    HrSection,
    type HrGlassCardProps,
    type HrGradientHeaderProps,
    type HrStatusIndicatorProps,
    type HrGradientButtonProps,
    type HrStatCardProps,
    type HrSectionProps,
    type StatusVariant,
} from './hr-design-system';

// Badge variants
export {
    leaveRequestStatusBadgeVariant,
    onboardingInvitationStatusBadgeVariant,
    complianceItemStatusBadgeVariant,
    type HrBadgeVariant,
} from './hr-badge-variants';

// Utilities
export { formatHumanDate } from './format-date';

// Form helpers
export { FieldError } from './field-error';
export type { FieldErrors } from './form-errors';

