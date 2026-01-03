/**
 * HR Resource Types
 *
 * Type-safe resource identifiers for ABAC policies.
 *
 * @module hr-permissions/resources
 */

/**
 * HR resource type constants for ABAC policies.
 * Values follow dot-notation: `hr.<module>.<subresource>`.
 */
export const HR_RESOURCE_TYPE = {
    // Absences
    ABSENCE: 'hr.absence',
    ABSENCE_SETTINGS: 'hr.absence.settings',
    ABSENCE_ATTACHMENT: 'hr.absence.attachment',

    // Compliance
    COMPLIANCE_ITEM: 'hr.compliance.item',
    COMPLIANCE_TEMPLATE: 'hr.compliance.template',
    COMPLIANCE_REVIEW: 'hr.compliance.review',

    // Leave
    LEAVE_REQUEST: 'hr.leave.request',
    LEAVE_BALANCE: 'hr.leave.balance',
    LEAVE_POLICY: 'hr.leave.policy',
    LEAVE_TYPE: 'hr.leave.type',

    // Notifications
    NOTIFICATION: 'hr.notification',
    REMINDER: 'hr.reminder',

    // Onboarding
    ONBOARDING_INVITE: 'hr.onboarding.invite',
    ONBOARDING_CHECKLIST: 'hr.onboarding.checklist',
    ONBOARDING_TASK: 'hr.onboarding.task',
    CHECKLIST_TEMPLATE: 'hr.checklist.template',

    // People
    EMPLOYEE_PROFILE: 'hr.people.profile',
    EMPLOYMENT_CONTRACT: 'hr.people.contract',

    // Performance
    PERFORMANCE_REVIEW: 'hr.performance.review',
    PERFORMANCE_GOAL: 'hr.performance.goal',
    PERFORMANCE_FEEDBACK: 'hr.performance.feedback',

    // Policies (Handbook)
    POLICY: 'hr.policy',
    POLICY_ACKNOWLEDGMENT: 'hr.policy.acknowledgment',

    // Settings
    HR_SETTINGS: 'hr.settings',
    ORG_SETTINGS: 'org.settings',

    // Time Tracking
    TIME_ENTRY: 'hr.time.entry',
    TIMESHEET: 'hr.time.sheet',

    // Training
    TRAINING_RECORD: 'hr.training.record',
    TRAINING_ENROLLMENT: 'hr.training.enrollment',
} as const;

export type HrResourceType = (typeof HR_RESOURCE_TYPE)[keyof typeof HR_RESOURCE_TYPE];

/**
 * Type guard for HrResourceType.
 */
export function isHrResourceType(value: string): value is HrResourceType {
    return (Object.values(HR_RESOURCE_TYPE) as string[]).includes(value);
}

// Legacy alias preserved for backwards compatibility
export const HR_RESOURCE = HR_RESOURCE_TYPE;
