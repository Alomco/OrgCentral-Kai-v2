/**
 * HR Permission Profiles
 *
 * Pre-built permission requirement profiles for RBAC guards.
 *
 * @module hr-permissions/profiles
 */
import type { OrgPermissionMap } from '@/server/security/access-control';
import { HR_ACTION } from './actions';
import { HR_RESOURCE_TYPE } from './resources';

const r = HR_RESOURCE_TYPE;
const a = HR_ACTION;

/**
 * Permission requirement profiles grouped by domain area.
 * Use these in guards for consistent permission checks.
 */
export const HR_PERMISSION_PROFILE = {
    // Absence permissions
    ABSENCE_READ: { [r.ABSENCE]: [a.READ] } satisfies OrgPermissionMap,
    ABSENCE_LIST: { [r.ABSENCE]: [a.LIST] } satisfies OrgPermissionMap,
    ABSENCE_CREATE: { [r.ABSENCE]: [a.CREATE] } satisfies OrgPermissionMap,
    ABSENCE_UPDATE: { [r.ABSENCE]: [a.UPDATE] } satisfies OrgPermissionMap,
    ABSENCE_DELETE: { [r.ABSENCE]: [a.DELETE] } satisfies OrgPermissionMap,
    ABSENCE_ACKNOWLEDGE: { [r.ABSENCE]: [a.ACKNOWLEDGE] } satisfies OrgPermissionMap,
    ABSENCE_CANCEL: { [r.ABSENCE]: [a.CANCEL] } satisfies OrgPermissionMap,
    ABSENCE_MANAGE: { [r.ABSENCE]: [a.READ, a.LIST, a.UPDATE, a.DELETE, a.ACKNOWLEDGE, a.CANCEL] } satisfies OrgPermissionMap,
    ABSENCE_SETTINGS_READ: { [r.ABSENCE_SETTINGS]: [a.READ] } satisfies OrgPermissionMap,
    ABSENCE_SETTINGS_UPDATE: { [r.ABSENCE_SETTINGS]: [a.UPDATE] } satisfies OrgPermissionMap,

    // Compliance permissions
    COMPLIANCE_READ: { [r.COMPLIANCE_ITEM]: [a.READ] } satisfies OrgPermissionMap,
    COMPLIANCE_LIST: { [r.COMPLIANCE_ITEM]: [a.LIST] } satisfies OrgPermissionMap,
    COMPLIANCE_CREATE: { [r.COMPLIANCE_ITEM]: [a.CREATE] } satisfies OrgPermissionMap,
    COMPLIANCE_UPDATE: { [r.COMPLIANCE_ITEM]: [a.UPDATE] } satisfies OrgPermissionMap,
    COMPLIANCE_DELETE: { [r.COMPLIANCE_ITEM]: [a.DELETE] } satisfies OrgPermissionMap,
    COMPLIANCE_REVIEW: { [r.COMPLIANCE_ITEM]: [a.REVIEW] } satisfies OrgPermissionMap,
    COMPLIANCE_ASSIGN: { [r.COMPLIANCE_ITEM]: [a.ASSIGN] } satisfies OrgPermissionMap,
    COMPLIANCE_MANAGE: { [r.COMPLIANCE_ITEM]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE, a.REVIEW, a.ASSIGN] } satisfies OrgPermissionMap,
    COMPLIANCE_TEMPLATE_READ: { [r.COMPLIANCE_TEMPLATE]: [a.READ] } satisfies OrgPermissionMap,
    COMPLIANCE_TEMPLATE_MANAGE: { [r.COMPLIANCE_TEMPLATE]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,

    // Leave permissions
    LEAVE_READ: { [r.LEAVE_REQUEST]: [a.READ] } satisfies OrgPermissionMap,
    LEAVE_LIST: { [r.LEAVE_REQUEST]: [a.LIST] } satisfies OrgPermissionMap,
    LEAVE_CREATE: { [r.LEAVE_REQUEST]: [a.CREATE] } satisfies OrgPermissionMap,
    LEAVE_UPDATE: { [r.LEAVE_REQUEST]: [a.UPDATE] } satisfies OrgPermissionMap,
    LEAVE_DELETE: { [r.LEAVE_REQUEST]: [a.DELETE] } satisfies OrgPermissionMap,
    LEAVE_APPROVE: { [r.LEAVE_REQUEST]: [a.APPROVE] } satisfies OrgPermissionMap,
    LEAVE_CANCEL: { [r.LEAVE_REQUEST]: [a.CANCEL] } satisfies OrgPermissionMap,
    LEAVE_MANAGE: { [r.LEAVE_REQUEST]: [a.READ, a.LIST, a.UPDATE, a.DELETE, a.APPROVE, a.CANCEL] } satisfies OrgPermissionMap,
    LEAVE_BALANCE_READ: { [r.LEAVE_BALANCE]: [a.READ] } satisfies OrgPermissionMap,
    LEAVE_BALANCE_ADJUST: { [r.LEAVE_BALANCE]: [a.ADJUST] } satisfies OrgPermissionMap,
    LEAVE_POLICY_READ: { [r.LEAVE_POLICY]: [a.READ] } satisfies OrgPermissionMap,
    LEAVE_POLICY_MANAGE: { [r.LEAVE_POLICY]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,

    // Notification permissions
    NOTIFICATION_READ: { [r.NOTIFICATION]: [a.READ] } satisfies OrgPermissionMap,
    NOTIFICATION_LIST: { [r.NOTIFICATION]: [a.LIST] } satisfies OrgPermissionMap,
    NOTIFICATION_CREATE: { [r.NOTIFICATION]: [a.CREATE] } satisfies OrgPermissionMap,
    NOTIFICATION_MANAGE: { [r.NOTIFICATION]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,
    REMINDER_MANAGE: { [r.REMINDER]: [a.READ, a.LIST, a.CREATE, a.UPDATE] } satisfies OrgPermissionMap,

    // Onboarding permissions
    ONBOARDING_READ: { [r.ONBOARDING_TASK]: [a.READ] } satisfies OrgPermissionMap,
    ONBOARDING_LIST: { [r.ONBOARDING_TASK]: [a.LIST] } satisfies OrgPermissionMap,
    ONBOARDING_CREATE: { [r.ONBOARDING_TASK]: [a.CREATE] } satisfies OrgPermissionMap,
    ONBOARDING_UPDATE: { [r.ONBOARDING_TASK]: [a.UPDATE] } satisfies OrgPermissionMap,
    ONBOARDING_SEND: { [r.ONBOARDING_INVITE]: [a.SEND] } satisfies OrgPermissionMap,
    ONBOARDING_COMPLETE: { [r.ONBOARDING_TASK]: [a.COMPLETE] } satisfies OrgPermissionMap,
    ONBOARDING_MANAGE: { [r.ONBOARDING_TASK]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE, a.COMPLETE], [r.ONBOARDING_INVITE]: [a.SEND] } satisfies OrgPermissionMap,
    CHECKLIST_TEMPLATE_READ: { [r.CHECKLIST_TEMPLATE]: [a.READ] } satisfies OrgPermissionMap,
    CHECKLIST_TEMPLATE_MANAGE: { [r.CHECKLIST_TEMPLATE]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,

    // People permissions
    PROFILE_READ: { [r.EMPLOYEE_PROFILE]: [a.READ] } satisfies OrgPermissionMap,
    PROFILE_LIST: { [r.EMPLOYEE_PROFILE]: [a.LIST] } satisfies OrgPermissionMap,
    PROFILE_CREATE: { [r.EMPLOYEE_PROFILE]: [a.CREATE] } satisfies OrgPermissionMap,
    PROFILE_UPDATE: { [r.EMPLOYEE_PROFILE]: [a.UPDATE] } satisfies OrgPermissionMap,
    PROFILE_DELETE: { [r.EMPLOYEE_PROFILE]: [a.DELETE] } satisfies OrgPermissionMap,
    PROFILE_MANAGE: { [r.EMPLOYEE_PROFILE]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,
    CONTRACT_READ: { [r.EMPLOYMENT_CONTRACT]: [a.READ] } satisfies OrgPermissionMap,
    CONTRACT_LIST: { [r.EMPLOYMENT_CONTRACT]: [a.LIST] } satisfies OrgPermissionMap,
    CONTRACT_MANAGE: { [r.EMPLOYMENT_CONTRACT]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,

    // Performance permissions
    PERFORMANCE_READ: { [r.PERFORMANCE_REVIEW]: [a.READ] } satisfies OrgPermissionMap,
    PERFORMANCE_LIST: { [r.PERFORMANCE_REVIEW]: [a.LIST] } satisfies OrgPermissionMap,
    PERFORMANCE_CREATE: { [r.PERFORMANCE_REVIEW]: [a.CREATE] } satisfies OrgPermissionMap,
    PERFORMANCE_UPDATE: { [r.PERFORMANCE_REVIEW]: [a.UPDATE] } satisfies OrgPermissionMap,
    PERFORMANCE_DELETE: { [r.PERFORMANCE_REVIEW]: [a.DELETE] } satisfies OrgPermissionMap,
    PERFORMANCE_FEEDBACK: { [r.PERFORMANCE_FEEDBACK]: [a.CREATE, a.UPDATE] } satisfies OrgPermissionMap,
    PERFORMANCE_MANAGE: { [r.PERFORMANCE_REVIEW]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,
    PERFORMANCE_GOAL_READ: { [r.PERFORMANCE_GOAL]: [a.READ] } satisfies OrgPermissionMap,
    PERFORMANCE_GOAL_MANAGE: { [r.PERFORMANCE_GOAL]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE] } satisfies OrgPermissionMap,

    // HR Policy (handbook) permissions
    POLICY_READ: { [r.POLICY]: [a.READ] } satisfies OrgPermissionMap,
    POLICY_LIST: { [r.POLICY]: [a.LIST] } satisfies OrgPermissionMap,
    POLICY_CREATE: { [r.POLICY]: [a.CREATE] } satisfies OrgPermissionMap,
    POLICY_UPDATE: { [r.POLICY]: [a.UPDATE] } satisfies OrgPermissionMap,
    POLICY_ACKNOWLEDGE: { [r.POLICY_ACKNOWLEDGMENT]: [a.ACKNOWLEDGE] } satisfies OrgPermissionMap,
    POLICY_PUBLISH: { [r.POLICY]: [a.PUBLISH] } satisfies OrgPermissionMap,
    POLICY_MANAGE: { [r.POLICY]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE, a.PUBLISH, a.UNPUBLISH] } satisfies OrgPermissionMap,

    // Settings permissions
    SETTINGS_READ: { [r.HR_SETTINGS]: [a.READ] } satisfies OrgPermissionMap,
    SETTINGS_UPDATE: { [r.HR_SETTINGS]: [a.UPDATE] } satisfies OrgPermissionMap,
    ORG_SETTINGS_READ: { [r.ORG_SETTINGS]: [a.READ] } satisfies OrgPermissionMap,
    ORG_SETTINGS_UPDATE: { [r.ORG_SETTINGS]: [a.UPDATE] } satisfies OrgPermissionMap,

    // Time Tracking permissions
    TIME_ENTRY_READ: { [r.TIME_ENTRY]: [a.READ] } satisfies OrgPermissionMap,
    TIME_ENTRY_LIST: { [r.TIME_ENTRY]: [a.LIST] } satisfies OrgPermissionMap,
    TIME_ENTRY_CREATE: { [r.TIME_ENTRY]: [a.CREATE] } satisfies OrgPermissionMap,
    TIME_ENTRY_UPDATE: { [r.TIME_ENTRY]: [a.UPDATE] } satisfies OrgPermissionMap,
    TIME_ENTRY_DELETE: { [r.TIME_ENTRY]: [a.DELETE] } satisfies OrgPermissionMap,
    TIME_ENTRY_APPROVE: { [r.TIME_ENTRY]: [a.APPROVE] } satisfies OrgPermissionMap,
    TIME_ENTRY_MANAGE: { [r.TIME_ENTRY]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE, a.APPROVE] } satisfies OrgPermissionMap,

    // Training permissions
    TRAINING_READ: { [r.TRAINING_RECORD]: [a.READ] } satisfies OrgPermissionMap,
    TRAINING_LIST: { [r.TRAINING_RECORD]: [a.LIST] } satisfies OrgPermissionMap,
    TRAINING_ENROLL: { [r.TRAINING_ENROLLMENT]: [a.ENROLL] } satisfies OrgPermissionMap,
    TRAINING_COMPLETE: { [r.TRAINING_ENROLLMENT]: [a.COMPLETE] } satisfies OrgPermissionMap,
    TRAINING_MANAGE: { [r.TRAINING_RECORD]: [a.READ, a.LIST, a.CREATE, a.UPDATE, a.DELETE], [r.TRAINING_ENROLLMENT]: [a.ENROLL, a.COMPLETE] } satisfies OrgPermissionMap,
} as const;

export type HrPermissionProfileKey = keyof typeof HR_PERMISSION_PROFILE;
