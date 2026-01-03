/**
 * ABAC Policies Index
 *
 * Aggregates all policy modules into the default bootstrap set.
 *
 * @module abac-policies
 */
import type { AbacPolicy } from '../abac-types';

import { ADMIN_TIER_POLICIES } from './admin';
import { HR_ADMIN_POLICIES } from './hr-admin';
import { MANAGER_POLICIES } from './manager';
import { COMPLIANCE_POLICIES } from './compliance';
import { MEMBER_POLICIES } from './member';
import { OWNERSHIP_POLICIES, DEFAULT_DENY_POLICY } from './ownership';

// Re-export individual policy modules for selective imports.
export { ADMIN_TIER_POLICIES, GLOBAL_ADMIN_POLICIES, OWNER_POLICIES, ORG_ADMIN_POLICIES } from './admin';
export { HR_ADMIN_POLICIES } from './hr-admin';
export { MANAGER_POLICIES } from './manager';
export { COMPLIANCE_POLICIES } from './compliance';
export { MEMBER_POLICIES } from './member';
export { OWNERSHIP_POLICIES, DEFAULT_DENY_POLICY } from './ownership';

/**
 * Default bootstrap ABAC policies.
 *
 * These policies seed tenant-specific ABAC policy sets at org creation time.
 * They implement a role-based hierarchy with sensible defaults stored in the database.
 *
 * Priority order (higher = evaluated first):
 * - 1100: Global admin (platform level)
 * - 1000: Owner (tenant level)
 * - 900: Org admin
 * - 800: HR admin
 * - 750: Manager (team-level)
 * - 700: Compliance officer
 * - 600: Member (self-service)
 * - 500: Resource ownership (self-service with ownership check)
 * - 100: Default deny
 */
export const DEFAULT_BOOTSTRAP_POLICIES: AbacPolicy[] = [
    ...ADMIN_TIER_POLICIES,
    ...HR_ADMIN_POLICIES,
    ...MANAGER_POLICIES,
    ...COMPLIANCE_POLICIES,
    ...MEMBER_POLICIES,
    ...OWNERSHIP_POLICIES,
    DEFAULT_DENY_POLICY,
];
