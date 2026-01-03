/**
 * Permission Check Utilities
 *
 * Re-exports from split modules for backwards compatibility.
 *
 * @module permission-check
 * @see permission-check/index for the split implementation
 */
export {
    // Types
    type PermissionCheckResult,
    // Generic checkers
    checkPermissions,
    checkAnyPermissions,
    // Role-based checkers
    isAdmin,
    isHrAdmin,
    isManager,
    isSelf,
    isSelfOrAdmin,
    isSelfOrHrAdmin,
    isSelfOrManager,
    // HR profile checkers
    hasHrPermission,
    hasAnyHrPermission,
    // Domain-specific checkers
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
} from './permission-check/index';
