/**
 * ABAC Policies - Admin Tier
 *
 * Policies for platform-level (global admin), owner, and org admin roles.
 *
 * @module abac-policies/admin
 */
import type { AbacPolicy } from '../abac-types';

/**
 * Global admin policy - unrestricted platform access.
 * Priority: 1100
 */
export const GLOBAL_ADMIN_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:globalAdmin:allow-all',
        description: 'Global admins have unrestricted access.',
        effect: 'allow',
        actions: ['*'],
        resources: ['*'],
        condition: { subject: { roles: ['globalAdmin'] } },
        priority: 1100,
    },
];

/**
 * Owner policies - full tenant access.
 * Priority: 1000
 */
export const OWNER_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:owner:allow-all',
        description: 'Owners have full access to their organization.',
        effect: 'allow',
        actions: ['*'],
        resources: ['*'],
        condition: { subject: { roles: ['owner'] } },
        priority: 1000,
    },
];

/**
 * Org admin policies - full organization resource access.
 * Priority: 900
 */
export const ORG_ADMIN_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:orgAdmin:allow-all',
        description: 'Org admins have full access to organization resources.',
        effect: 'allow',
        actions: ['*'],
        resources: ['*'],
        condition: { subject: { roles: ['orgAdmin'] } },
        priority: 900,
    },
];

/** Combined admin-tier policies. */
export const ADMIN_TIER_POLICIES: AbacPolicy[] = [
    ...GLOBAL_ADMIN_POLICIES,
    ...OWNER_POLICIES,
    ...ORG_ADMIN_POLICIES,
];
