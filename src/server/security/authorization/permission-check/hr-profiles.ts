/**
 * HR Profile Permission Checkers
 *
 * Utilities for checking HR-specific permission profiles.
 *
 * @module permission-check/hr-profiles
 */
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { permissionsSatisfy, satisfiesAnyPermissionProfile } from '../permission-utils';
import {
    HR_PERMISSION_PROFILE,
    HR_ANY_PERMISSION_PROFILE,
    type HrPermissionProfileKey,
    type HrAnyPermissionProfileKey,
} from '../hr-permissions';

/**
 * Check if context has a specific HR permission profile.
 */
export function hasHrPermission(
    context: RepositoryAuthorizationContext,
    profileKey: HrPermissionProfileKey,
): boolean {
    const profile = HR_PERMISSION_PROFILE[profileKey];
    return permissionsSatisfy(context.permissions, profile);
}

/**
 * Check if context has any of the specified HR permission profiles.
 */
export function hasAnyHrPermission(
    context: RepositoryAuthorizationContext,
    profileKey: HrAnyPermissionProfileKey,
): boolean {
    const profiles = HR_ANY_PERMISSION_PROFILE[profileKey];
    return satisfiesAnyPermissionProfile(context.permissions, profiles);
}
