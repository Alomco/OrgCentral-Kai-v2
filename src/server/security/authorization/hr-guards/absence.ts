/**
 * HR Absence Guards
 *
 * Guards for absence-related operations.
 *
 * @module hr-guards/absence
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

export function canManageAbsences(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.ABSENCE_MANAGEMENT);
}

export function assertAbsenceReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.ABSENCE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.ABSENCE_READ,
    });
}

export function assertAbsenceCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.ABSENCE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.ABSENCE_CREATE,
    });
}

export function assertAbsenceAcknowledger(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.ACKNOWLEDGE,
        resourceType: HR_RESOURCE_TYPE.ABSENCE,
        resourceAttributes: request.resourceAttributes,
        anyOfPermissions: HR_ANY_PERMISSION_PROFILE.ABSENCE_ACKNOWLEDGMENT,
    });
}

export function assertAbsenceActorOrPrivileged(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): void {
    assertActorOrPrivileged(context, targetUserId, HR_ANY_PERMISSION_PROFILE.ABSENCE_MANAGEMENT);
}

export function assertPrivilegedAbsenceActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.ABSENCE_MANAGEMENT,
        'You do not have permission to manage organization-wide absences.',
    );
}
