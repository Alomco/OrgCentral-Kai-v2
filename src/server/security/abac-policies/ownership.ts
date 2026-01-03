/**
 * ABAC Policies - Resource Ownership
 *
 * Fine-grained self-service policies based on resource ownership.
 *
 * @module abac-policies/ownership
 */
import type { AbacPolicy } from '../abac-types';

/** All roles that can claim resource ownership. */
const OWNERSHIP_ROLES = ['member', 'manager', 'hrAdmin', 'orgAdmin', 'owner', 'compliance'];

/**
 * Resource ownership policies.
 * Priority: 500
 */
export const OWNERSHIP_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:owner-update-own-profile',
        description: 'Users can update their own employee profile.',
        effect: 'allow',
        actions: ['update'],
        resources: ['employeeProfile', 'hr.people.profile'],
        condition: {
            subject: { roles: OWNERSHIP_ROLES },
            resource: { ownerMatchesSubject: true },
        },
        priority: 500,
    },
    {
        id: 'default:abac:owner-read-own-contract',
        description: 'Users can read their own employment contract.',
        effect: 'allow',
        actions: ['read'],
        resources: ['employmentContract', 'hr.people.contract'],
        condition: {
            subject: { roles: OWNERSHIP_ROLES },
            resource: { ownerMatchesSubject: true },
        },
        priority: 500,
    },
];

/**
 * Default deny policy - catch-all fallback.
 * Priority: 100
 */
export const DEFAULT_DENY_POLICY: AbacPolicy = {
    id: 'default:abac:deny-all',
    description: 'Deny all access by default.',
    effect: 'deny',
    actions: ['*'],
    resources: ['*'],
    condition: {},
    priority: 100,
};
