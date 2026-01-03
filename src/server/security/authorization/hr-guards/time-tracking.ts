/**
 * HR Time Tracking Guards
 *
 * Guards for time tracking operations.
 *
 * @module hr-guards/time-tracking
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
    assertPrivileged,
    type HrGuardRequest,
} from './core';

export function canManageTimeEntries(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.TIME_TRACKING_MANAGEMENT);
}

export function canApproveTimeEntries(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.TIME_ENTRY_APPROVAL);
}

export function assertTimeEntryReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.TIME_ENTRY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.TIME_ENTRY_READ,
    });
}

export function assertTimeEntryCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.TIME_ENTRY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.TIME_ENTRY_CREATE,
    });
}

export function assertTimeEntryUpdater(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.TIME_ENTRY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.TIME_ENTRY_UPDATE,
    });
}

export function assertTimeEntryApprover(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.APPROVE,
        resourceType: HR_RESOURCE_TYPE.TIME_ENTRY,
        resourceAttributes: request.resourceAttributes,
        anyOfPermissions: HR_ANY_PERMISSION_PROFILE.TIME_ENTRY_APPROVAL,
    });
}

export function assertTimeEntryActorOrPrivileged(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): void {
    assertActorOrPrivileged(context, targetUserId, HR_ANY_PERMISSION_PROFILE.TIME_TRACKING_MANAGEMENT);
}

export function assertPrivilegedTimeEntryActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.TIME_TRACKING_MANAGEMENT,
        'You do not have permission to manage organization time entries.',
    );
}
