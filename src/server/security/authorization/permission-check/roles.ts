/**
 * Role-Based Permission Checkers
 *
 * Utilities for role-based access checks.
 *
 * @module permission-check/roles
 */
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrgRoleKey } from '@/server/security/access-control';

const ADMIN_ROLES: readonly OrgRoleKey[] = ['globalAdmin', 'owner', 'orgAdmin'];
const HR_ADMIN_ROLES: readonly OrgRoleKey[] = ['globalAdmin', 'owner', 'orgAdmin', 'hrAdmin'];
const MANAGER_ROLES: readonly OrgRoleKey[] = ['globalAdmin', 'owner', 'orgAdmin', 'hrAdmin', 'manager'];

/**
 * Check if context has an admin role.
 */
export function isAdmin(context: RepositoryAuthorizationContext): boolean {
    return ADMIN_ROLES.includes(context.roleKey as OrgRoleKey);
}

/**
 * Check if context has an HR admin role.
 */
export function isHrAdmin(context: RepositoryAuthorizationContext): boolean {
    return HR_ADMIN_ROLES.includes(context.roleKey as OrgRoleKey);
}

/**
 * Check if context has a manager role.
 */
export function isManager(context: RepositoryAuthorizationContext): boolean {
    return MANAGER_ROLES.includes(context.roleKey as OrgRoleKey);
}

/**
 * Check if context is the same user as target.
 */
export function isSelf(context: RepositoryAuthorizationContext, targetUserId: string): boolean {
    return context.userId === targetUserId;
}

/**
 * Check if context is self or has admin access.
 */
export function isSelfOrAdmin(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): boolean {
    return isSelf(context, targetUserId) || isAdmin(context);
}

/**
 * Check if context is self or has HR admin access.
 */
export function isSelfOrHrAdmin(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): boolean {
    return isSelf(context, targetUserId) || isHrAdmin(context);
}

/**
 * Check if context is self or has manager access.
 */
export function isSelfOrManager(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): boolean {
    return isSelf(context, targetUserId) || isManager(context);
}
