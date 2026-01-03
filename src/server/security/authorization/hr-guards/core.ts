/**
 * HR Guards Core Module
 *
 * Core guard functions and utilities for HR authorization.
 * Domain-specific guards are in separate modules.
 *
 * @module hr-guards/core
 */
import { AuthorizationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrgPermissionMap } from '@/server/security/access-control';
import { requireAbacAllowance } from '../abac-context';
import { authorizeOrgAccessRbacOnly } from '../engine';
import { permissionsSatisfy, satisfiesAnyPermissionProfile } from '../permission-utils';
import type { HrAction, HrResourceType } from '../hr-permissions';

// ============================================================================
// Guard Request Types
// ============================================================================

/**
 * Base guard request containing authorization context.
 */
export interface HrGuardRequest {
    readonly authorization: RepositoryAuthorizationContext;
    readonly resourceAttributes?: Readonly<Record<string, unknown>>;
}

/**
 * Guard request with target user for ownership checks.
 */
export interface HrGuardRequestWithTarget extends HrGuardRequest {
    readonly targetUserId: string;
}

/**
 * Guard request with custom action override.
 */
export interface HrGuardRequestWithAction extends HrGuardRequest {
    readonly action?: HrAction;
}

// ============================================================================
// Guard Defaults Configuration
// ============================================================================

interface HrGuardDefaults {
    readonly requiredPermissions: OrgPermissionMap;
    readonly expectedResidency?: undefined;
    readonly expectedClassification?: undefined;
}

const DEFAULT_GUARD_CONFIG: HrGuardDefaults = {
    requiredPermissions: {},
    expectedResidency: undefined,
    expectedClassification: undefined,
};

// ============================================================================
// Core Guard Function
// ============================================================================

/**
 * Core guard function that combines RBAC and ABAC checks.
 * All other guards delegate to this function.
 */
export async function assertHrAccess(
    authorization: RepositoryAuthorizationContext,
    params: {
        action: HrAction;
        resourceType: HrResourceType;
        resourceAttributes?: Readonly<Record<string, unknown>>;
        requiredPermissions?: OrgPermissionMap;
        anyOfPermissions?: readonly OrgPermissionMap[];
    },
): Promise<RepositoryAuthorizationContext> {
    authorizeOrgAccessRbacOnly(
        {
            orgId: authorization.orgId,
            userId: authorization.userId,
            requiredPermissions: params.requiredPermissions ?? DEFAULT_GUARD_CONFIG.requiredPermissions,
            requiredAnyPermissions: params.anyOfPermissions,
            expectedResidency: DEFAULT_GUARD_CONFIG.expectedResidency,
            expectedClassification: DEFAULT_GUARD_CONFIG.expectedClassification,
        },
        authorization,
    );

    await requireAbacAllowance({
        orgId: authorization.orgId,
        userId: authorization.userId,
        action: params.action,
        resourceType: params.resourceType,
        roles: authorization.roleName && authorization.roleName !== authorization.roleKey
            ? [authorization.roleKey, authorization.roleName]
            : [authorization.roleKey],
        guardContext: authorization,
        resourceAttributes: {
            ...params.resourceAttributes,
            residency: authorization.dataResidency,
            classification: authorization.dataClassification,
        },
    });

    return authorization;
}

// ============================================================================
// Permission Check Utilities
// ============================================================================

/**
 * Checks if context has specific permission profile.
 */
export function hasPermission(
    context: RepositoryAuthorizationContext,
    profile: OrgPermissionMap,
): boolean {
    return permissionsSatisfy(context.permissions, profile);
}

/**
 * Checks if context has any of the specified permission profiles.
 */
export function hasAnyPermission(
    context: RepositoryAuthorizationContext,
    profiles: readonly OrgPermissionMap[],
): boolean {
    return satisfiesAnyPermissionProfile(context.permissions, profiles);
}

/**
 * Asserts that context is either the target user or has elevated permissions.
 */
export function assertActorOrPrivileged(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
    profiles: readonly OrgPermissionMap[],
): void {
    if (context.userId === targetUserId) {
        return;
    }
    if (hasAnyPermission(context, profiles)) {
        return;
    }
    throw new AuthorizationError('You are not allowed to act on behalf of this member.');
}

/**
 * Asserts that context has one of the privileged permission profiles.
 */
export function assertPrivileged(
    context: RepositoryAuthorizationContext,
    profiles: readonly OrgPermissionMap[],
    message = 'You do not have permission to perform this action.',
): void {
    if (!hasAnyPermission(context, profiles)) {
        throw new AuthorizationError(message);
    }
}
