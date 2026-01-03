/**
 * Generic Permission Checkers
 *
 * Low-level permission check utilities.
 *
 * @module permission-check/generic
 */
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrgPermissionMap } from '@/server/security/access-control';
import { permissionsSatisfy, satisfiesAnyPermissionProfile } from '../permission-utils';
import type { PermissionCheckResult } from './types';

/**
 * Check if context has all required permissions.
 */
export function checkPermissions(
    context: RepositoryAuthorizationContext,
    required: OrgPermissionMap,
): PermissionCheckResult {
    const allowed = permissionsSatisfy(context.permissions, required);
    return {
        allowed,
        reason: allowed ? undefined : 'Missing required permissions.',
    };
}

/**
 * Check if context has any of the required permission profiles.
 */
export function checkAnyPermissions(
    context: RepositoryAuthorizationContext,
    profiles: readonly OrgPermissionMap[],
): PermissionCheckResult {
    const allowed = satisfiesAnyPermissionProfile(context.permissions, profiles);
    return {
        allowed,
        reason: allowed ? undefined : 'Missing at least one required permission set.',
    };
}
