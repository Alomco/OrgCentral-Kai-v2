/**
 * HR Leave Guards
 *
 * Guards for leave-related operations.
 *
 * @module hr-guards/leave
 */
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    HR_ACTION,
    HR_RESOURCE_TYPE,
    HR_PERMISSION_PROFILE,
    HR_ANY_PERMISSION_PROFILE,
} from '../hr-permissions';
import {
    assertHrAccess,
    hasAnyPermission,
    assertActorOrPrivileged,
    type HrGuardRequest,
} from './core';

export function canManageLeave(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.LEAVE_MANAGEMENT);
}

export function canApproveLeave(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.LEAVE_APPROVAL);
}

export function assertLeaveReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.LEAVE_REQUEST,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.LEAVE_READ,
    });
}

export function assertLeaveCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.LEAVE_REQUEST,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.LEAVE_CREATE,
    });
}

export function assertLeaveApprover(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.APPROVE,
        resourceType: HR_RESOURCE_TYPE.LEAVE_REQUEST,
        resourceAttributes: request.resourceAttributes,
        anyOfPermissions: HR_ANY_PERMISSION_PROFILE.LEAVE_APPROVAL,
    });
}

export function assertLeaveCanceller(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CANCEL,
        resourceType: HR_RESOURCE_TYPE.LEAVE_REQUEST,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.LEAVE_CANCEL,
    });
}

export function assertLeaveActorOrPrivileged(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): void {
    assertActorOrPrivileged(context, targetUserId, HR_ANY_PERMISSION_PROFILE.LEAVE_MANAGEMENT);
}
