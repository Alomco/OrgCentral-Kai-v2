import type { AbacPolicy } from './abac-types';

export const DEFAULT_BOOTSTRAP_POLICIES: AbacPolicy[] = [
  {
    id: 'default:abac:owner:allow-all',
    description: 'Fallback ABAC: allow owners to proceed when tenant policies are missing.',
    effect: 'allow',
    actions: ['*'],
    resources: ['*'],
    condition: { subject: { roles: ['owner'] } },
    priority: 1000,
  },
  {
    id: 'default:abac:orgAdmin:allow-all',
    description: 'Fallback ABAC: allow org admins to proceed when tenant policies are missing.',
    effect: 'allow',
    actions: ['*'],
    resources: ['*'],
    condition: { subject: { roles: ['orgAdmin'] } },
    priority: 900,
  },
  {
    id: 'default:abac:hrAdmin:allow-hr-resources',
    description: 'Fallback ABAC: allow HR admins to access all HR resources.',
    effect: 'allow',
    actions: ['*'],
    resources: ['employeeProfile', 'employmentContract', 'leaveRequest', 'absence', 'timeEntry', 'training'],
    condition: { subject: { roles: ['hrAdmin'] } },
    priority: 800,
  },
  {
    id: 'default:abac:member:allow-hr-read',
    description: 'Fallback ABAC: allow members to read HR resources (profiles, leave, etc).',
    effect: 'allow',
    actions: ['read', 'list'],
    resources: ['employeeProfile', 'employmentContract', 'leaveRequest', 'absence', 'timeEntry', 'training'],
    condition: { subject: { roles: ['member'] } },
    priority: 700,
  },
  {
    id: 'default:abac:member:allow-hr-create',
    description: 'Fallback ABAC: allow members to create their own leave/absence/timeEntry requests.',
    effect: 'allow',
    actions: ['create'],
    resources: ['leaveRequest', 'absence', 'timeEntry'],
    condition: { subject: { roles: ['member'] } },
    priority: 700,
  },
];
