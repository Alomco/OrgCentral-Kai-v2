/**
 * ABAC Policies - HR Admin Tier
 *
 * Policies for HR administrators with full HR module access.
 *
 * @module abac-policies/hr-admin
 */
import type { AbacPolicy } from '../abac-types';

/** All HR resource types for admin access. */
const HR_RESOURCES = [
    'hr.*',
    'employeeProfile',
    'employmentContract',
    'hr.absence',
    'hr.absence.settings',
    'hr.absence.attachment',
    'hr.compliance.item',
    'hr.compliance.template',
    'hr.compliance.review',
    'hr.leave.request',
    'hr.leave.balance',
    'hr.leave.policy',
    'hr.leave.type',
    'hr.notification',
    'hr.onboarding.invite',
    'hr.onboarding.checklist',
    'hr.checklist.template',
    'hr.people.profile',
    'hr.people.contract',
    'hr.performance.review',
    'hr.performance.goal',
    'hr.policy',
    'hr.policy.acknowledgment',
    'hr.settings',
    'hr.time.entry',
    'hr.time.sheet',
    'hr.training.record',
    'hr.training.enrollment',
];

/**
 * HR admin policies - full HR module access.
 * Priority: 800
 */
export const HR_ADMIN_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:hrAdmin:allow-hr-all',
        description: 'HR admins have full access to all HR resources.',
        effect: 'allow',
        actions: ['*'],
        resources: HR_RESOURCES,
        condition: { subject: { roles: ['hrAdmin'] } },
        priority: 800,
    },
];
