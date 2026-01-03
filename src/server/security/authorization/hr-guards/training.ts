/**
 * HR Training Guards
 *
 * Guards for training operations.
 *
 * @module hr-guards/training
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

export function canManageTraining(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.TRAINING_MANAGEMENT);
}

export function assertTrainingReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.TRAINING_RECORD,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.TRAINING_READ,
    });
}

export function assertTrainingEnroller(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.ENROLL,
        resourceType: HR_RESOURCE_TYPE.TRAINING_ENROLLMENT,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.TRAINING_ENROLL,
    });
}

export function assertTrainingCompleter(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.COMPLETE,
        resourceType: HR_RESOURCE_TYPE.TRAINING_RECORD,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.TRAINING_COMPLETE,
    });
}

export function assertTrainingActorOrPrivileged(
    context: RepositoryAuthorizationContext,
    targetUserId: string,
): void {
    assertActorOrPrivileged(context, targetUserId, HR_ANY_PERMISSION_PROFILE.TRAINING_MANAGEMENT);
}

export function assertPrivilegedTrainingActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.TRAINING_MANAGEMENT,
        'You do not have permission to manage organization training.',
    );
}
