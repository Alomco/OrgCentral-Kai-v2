/**
 * Composite HR Permission Profiles
 *
 * Permission profiles for "any of these" style checks.
 * Useful for actions that can be performed by multiple roles.
 *
 * @module hr-permissions/composite
 */
import type { OrgPermissionMap } from '@/server/security/access-control';
import { HR_PERMISSION_PROFILE } from './profiles';

/**
 * Composite permission profiles for multi-role access checks.
 */
export const HR_ANY_PERMISSION_PROFILE = {
    /**
     * Can manage absences: HR admin, org admin, or managers with acknowledge permission.
     */
    ABSENCE_MANAGEMENT: [
        HR_PERMISSION_PROFILE.ABSENCE_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage leave requests: HR admin, org admin, or managers with approve permission.
     */
    LEAVE_MANAGEMENT: [
        HR_PERMISSION_PROFILE.LEAVE_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage compliance: HR admin, org admin, or compliance officers.
     */
    COMPLIANCE_MANAGEMENT: [
        HR_PERMISSION_PROFILE.COMPLIANCE_MANAGE,
        { organization: ['update'] },
        { audit: ['write'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage time entries: HR admin, org admin, or managers.
     */
    TIME_TRACKING_MANAGEMENT: [
        HR_PERMISSION_PROFILE.TIME_ENTRY_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage training: HR admin or org admin.
     */
    TRAINING_MANAGEMENT: [
        HR_PERMISSION_PROFILE.TRAINING_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage onboarding: HR admin or org admin.
     */
    ONBOARDING_MANAGEMENT: [
        HR_PERMISSION_PROFILE.ONBOARDING_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage performance reviews: HR admin, org admin, or managers.
     */
    PERFORMANCE_MANAGEMENT: [
        HR_PERMISSION_PROFILE.PERFORMANCE_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage HR policies: HR admin or org admin.
     */
    POLICY_MANAGEMENT: [
        HR_PERMISSION_PROFILE.POLICY_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can manage employee profiles: HR admin or org admin.
     */
    PEOPLE_MANAGEMENT: [
        HR_PERMISSION_PROFILE.PROFILE_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can approve leave: managers or HR/org admins.
     */
    LEAVE_APPROVAL: [
        HR_PERMISSION_PROFILE.LEAVE_APPROVE,
        HR_PERMISSION_PROFILE.LEAVE_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can approve time entries: managers or HR/org admins.
     */
    TIME_ENTRY_APPROVAL: [
        HR_PERMISSION_PROFILE.TIME_ENTRY_APPROVE,
        HR_PERMISSION_PROFILE.TIME_ENTRY_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],

    /**
     * Can acknowledge absences: managers or HR/org admins.
     */
    ABSENCE_ACKNOWLEDGMENT: [
        HR_PERMISSION_PROFILE.ABSENCE_ACKNOWLEDGE,
        HR_PERMISSION_PROFILE.ABSENCE_MANAGE,
        { organization: ['update'] },
    ] as readonly OrgPermissionMap[],
} as const;

export type HrAnyPermissionProfileKey = keyof typeof HR_ANY_PERMISSION_PROFILE;
