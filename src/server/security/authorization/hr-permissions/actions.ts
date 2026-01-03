/**
 * HR Actions
 *
 * Type-safe action identifiers for ABAC and RBAC evaluation.
 *
 * @module hr-permissions/actions
 */

/**
 * Standard CRUD actions plus domain-specific operations.
 */
export const HR_ACTION = {
    // Standard CRUD
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',

    // Approval workflows
    APPROVE: 'approve',
    REJECT: 'reject',
    CANCEL: 'cancel',

    // Acknowledgments
    ACKNOWLEDGE: 'acknowledge',

    // Assignments
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',

    // Reviews
    REVIEW: 'review',
    SUBMIT: 'submit',

    // Training
    ENROLL: 'enroll',
    COMPLETE: 'complete',

    // Policies
    PUBLISH: 'publish',
    UNPUBLISH: 'unpublish',

    // Onboarding
    SEND: 'send',

    // Balance adjustments
    ADJUST: 'adjust',

    // Admin operations
    MANAGE: 'manage',
    CONFIGURE: 'configure',
} as const;

export type HrAction = (typeof HR_ACTION)[keyof typeof HR_ACTION];

/**
 * Type guard for HrAction.
 */
export function isHrAction(value: string): value is HrAction {
    return (Object.values(HR_ACTION) as string[]).includes(value);
}
