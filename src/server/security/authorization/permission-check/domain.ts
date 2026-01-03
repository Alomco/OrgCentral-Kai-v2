/**
 * Domain-Specific Permission Checkers
 *
 * High-level permission checkers for each HR domain.
 *
 * @module permission-check/domain
 */
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { hasHrPermission, hasAnyHrPermission } from './hr-profiles';

/**
 * Permission checkers for absence management.
 */
export const absencePermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_LIST'),
    canCreate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_CREATE'),
    canUpdate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_UPDATE'),
    canDelete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_DELETE'),
    canAcknowledge: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_ACKNOWLEDGE'),
    canCancel: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_CANCEL'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'ABSENCE_MANAGEMENT'),
    canManageSettings: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ABSENCE_SETTINGS_UPDATE'),
} as const;

/**
 * Permission checkers for leave management.
 */
export const leavePermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_LIST'),
    canCreate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_CREATE'),
    canUpdate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_UPDATE'),
    canDelete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_DELETE'),
    canApprove: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'LEAVE_APPROVAL'),
    canCancel: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_CANCEL'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'LEAVE_MANAGEMENT'),
    canAdjustBalance: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_BALANCE_ADJUST'),
    canManagePolicy: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'LEAVE_POLICY_MANAGE'),
} as const;

/**
 * Permission checkers for compliance management.
 */
export const compliancePermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_LIST'),
    canCreate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_CREATE'),
    canUpdate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_UPDATE'),
    canDelete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_DELETE'),
    canReview: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_REVIEW'),
    canAssign: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_ASSIGN'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'COMPLIANCE_MANAGEMENT'),
    canManageTemplates: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'COMPLIANCE_TEMPLATE_MANAGE'),
} as const;

/**
 * Permission checkers for time tracking.
 */
export const timeTrackingPermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TIME_ENTRY_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TIME_ENTRY_LIST'),
    canCreate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TIME_ENTRY_CREATE'),
    canUpdate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TIME_ENTRY_UPDATE'),
    canDelete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TIME_ENTRY_DELETE'),
    canApprove: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'TIME_ENTRY_APPROVAL'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'TIME_TRACKING_MANAGEMENT'),
} as const;

/**
 * Permission checkers for training.
 */
export const trainingPermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TRAINING_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TRAINING_LIST'),
    canEnroll: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TRAINING_ENROLL'),
    canComplete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'TRAINING_COMPLETE'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'TRAINING_MANAGEMENT'),
} as const;

/**
 * Permission checkers for onboarding.
 */
export const onboardingPermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ONBOARDING_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ONBOARDING_LIST'),
    canCreate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ONBOARDING_CREATE'),
    canSend: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ONBOARDING_SEND'),
    canComplete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'ONBOARDING_COMPLETE'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'ONBOARDING_MANAGEMENT'),
    canManageTemplates: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'CHECKLIST_TEMPLATE_MANAGE'),
} as const;

/**
 * Permission checkers for performance.
 */
export const performancePermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PERFORMANCE_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PERFORMANCE_LIST'),
    canCreate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PERFORMANCE_CREATE'),
    canUpdate: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PERFORMANCE_UPDATE'),
    canDelete: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PERFORMANCE_DELETE'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'PERFORMANCE_MANAGEMENT'),
} as const;

/**
 * Permission checkers for HR policies.
 */
export const policyPermissions = {
    canRead: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'POLICY_READ'),
    canList: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'POLICY_LIST'),
    canAcknowledge: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'POLICY_ACKNOWLEDGE'),
    canPublish: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'POLICY_PUBLISH'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'POLICY_MANAGEMENT'),
} as const;

/**
 * Permission checkers for people/profiles.
 */
export const peoplePermissions = {
    canReadProfile: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PROFILE_READ'),
    canListProfiles: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PROFILE_LIST'),
    canCreateProfile: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PROFILE_CREATE'),
    canUpdateProfile: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PROFILE_UPDATE'),
    canDeleteProfile: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'PROFILE_DELETE'),
    canReadContract: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'CONTRACT_READ'),
    canListContracts: (context: RepositoryAuthorizationContext) =>
        hasHrPermission(context, 'CONTRACT_LIST'),
    canManage: (context: RepositoryAuthorizationContext) =>
        hasAnyHrPermission(context, 'PEOPLE_MANAGEMENT'),
} as const;

/**
 * All permission checkers in one object for convenient imports.
 */
export const hrPermissions = {
    absence: absencePermissions,
    leave: leavePermissions,
    compliance: compliancePermissions,
    timeTracking: timeTrackingPermissions,
    training: trainingPermissions,
    onboarding: onboardingPermissions,
    performance: performancePermissions,
    policy: policyPermissions,
    people: peoplePermissions,
} as const;
