/**
 * ABAC Policies - Member Tier
 *
 * Policies for regular members with self-service access.
 *
 * @module abac-policies/member
 */
import type { AbacCondition, AbacPolicy } from '../abac-types';

const MEMBER_ROLE = 'member';
const MEMBER_SUBJECT: AbacCondition = { subject: { roles: [MEMBER_ROLE] } };
const MEMBER_POLICY_PRIORITY = 600;
const HR_LEAVE_REQUEST_RESOURCE = 'hr.leave.request';

/** HR resources members can read. */
const MEMBER_READ_RESOURCES = [
    'employeeProfile',
    'employmentContract',
    HR_LEAVE_REQUEST_RESOURCE,
    'hr.leave.balance',
    'hr.absence',
    'hr.compliance.item',
    'hr.performance.review',
    'hr.performance.goal',
    'hr.time.entry',
    'hr.training.record',
    'hr.notification',
    'hr.policy',
    'hr.onboarding.checklist',
];

/**
 * Member self-service policies.
 * Priority: 600
 */
export const MEMBER_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:member:read-hr-resources',
        description: 'Members can read HR resources.',
        effect: 'allow',
        actions: ['read', 'list'],
        resources: MEMBER_READ_RESOURCES,
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:create-own-leave',
        description: 'Members can create their own leave requests.',
        effect: 'allow',
        actions: ['create'],
        resources: [HR_LEAVE_REQUEST_RESOURCE],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:cancel-own-leave',
        description: 'Members can cancel their own pending leave requests.',
        effect: 'allow',
        actions: ['cancel'],
        resources: [HR_LEAVE_REQUEST_RESOURCE],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:create-own-absence',
        description: 'Members can report their own absences.',
        effect: 'allow',
        actions: ['create'],
        resources: ['hr.absence'],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:manage-own-time',
        description: 'Members can manage their own time entries.',
        effect: 'allow',
        actions: ['create', 'update'],
        resources: ['hr.time.entry'],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:update-own-compliance',
        description: 'Members can update their own compliance items.',
        effect: 'allow',
        actions: ['update'],
        resources: ['hr.compliance.item'],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:acknowledge-policy',
        description: 'Members can acknowledge HR policies.',
        effect: 'allow',
        actions: ['acknowledge'],
        resources: ['hr.policy', 'hr.policy.acknowledgment'],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:enroll-training',
        description: 'Members can enroll in training.',
        effect: 'allow',
        actions: ['enroll'],
        resources: ['hr.training.record', 'hr.training.enrollment'],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
    {
        id: 'default:abac:member:complete-onboarding',
        description: 'Members can complete their own onboarding items.',
        effect: 'allow',
        actions: ['update', 'complete'],
        resources: ['hr.onboarding.checklist'],
        condition: MEMBER_SUBJECT,
        priority: MEMBER_POLICY_PRIORITY,
    },
];
