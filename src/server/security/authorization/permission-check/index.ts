/**
 * Permission Check Index
 *
 * Barrel file re-exporting all permission check modules.
 *
 * @module permission-check
 */

// Types
export type { PermissionCheckResult } from './types';

// Generic checkers
export { checkPermissions, checkAnyPermissions } from './generic';

// Role-based checkers
export {
    isAdmin,
    isHrAdmin,
    isManager,
    isSelf,
    isSelfOrAdmin,
    isSelfOrHrAdmin,
    isSelfOrManager,
} from './roles';

// HR profile checkers
export { hasHrPermission, hasAnyHrPermission } from './hr-profiles';

// Domain-specific checkers
export {
    absencePermissions,
    leavePermissions,
    compliancePermissions,
    timeTrackingPermissions,
    trainingPermissions,
    onboardingPermissions,
    performancePermissions,
    policyPermissions,
    peoplePermissions,
    hrPermissions,
} from './domain';
