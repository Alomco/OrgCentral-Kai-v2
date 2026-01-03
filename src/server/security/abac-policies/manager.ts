/**
 * ABAC Policies - Manager Tier
 *
 * Policies for managers with team-level HR operations.
 *
 * @module abac-policies/manager
 */
import type { AbacPolicy } from '../abac-types';

/** HR resources managers can read. */
const MANAGER_READ_RESOURCES = [
    'hr.*',
    'employeeProfile',
    'employmentContract',
    'hr.absence',
    'hr.leave.request',
    'hr.leave.balance',
    'hr.compliance.item',
    'hr.performance.review',
    'hr.performance.goal',
    'hr.time.entry',
    'hr.time.sheet',
    'hr.training.record',
    'hr.notification',
];

/**
 * Manager policies - team-level operations.
 * Priority: 750
 */
export const MANAGER_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:manager:read-hr-resources',
        description: 'Managers can read HR resources.',
        effect: 'allow',
        actions: ['read', 'list'],
        resources: MANAGER_READ_RESOURCES,
        condition: { subject: { roles: ['manager'] } },
        priority: 750,
    },
    {
        id: 'default:abac:manager:approve-team-leave',
        description: 'Managers can approve leave requests for their team.',
        effect: 'allow',
        actions: ['approve', 'reject'],
        resources: ['hr.leave.request'],
        condition: { subject: { roles: ['manager'] } },
        priority: 750,
    },
    {
        id: 'default:abac:manager:acknowledge-team-absences',
        description: 'Managers can acknowledge absences for their team.',
        effect: 'allow',
        actions: ['acknowledge'],
        resources: ['hr.absence'],
        condition: { subject: { roles: ['manager'] } },
        priority: 750,
    },
    {
        id: 'default:abac:manager:approve-team-time',
        description: 'Managers can approve time entries for their team.',
        effect: 'allow',
        actions: ['approve'],
        resources: ['hr.time.entry', 'hr.time.sheet'],
        condition: { subject: { roles: ['manager'] } },
        priority: 750,
    },
    {
        id: 'default:abac:manager:manage-team-performance',
        description: 'Managers can manage performance reviews for their team.',
        effect: 'allow',
        actions: ['create', 'update'],
        resources: ['hr.performance.review', 'hr.performance.goal'],
        condition: { subject: { roles: ['manager'] } },
        priority: 750,
    },
];
