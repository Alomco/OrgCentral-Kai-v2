/**
 * HR Performance Guards
 *
 * Guards for performance review and goal operations.
 *
 * @module hr-guards/performance
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
    assertPrivileged,
    type HrGuardRequest,
} from './core';

export function canManagePerformance(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.PERFORMANCE_MANAGEMENT);
}

export function assertPerformanceReviewReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.PERFORMANCE_REVIEW,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PERFORMANCE_READ,
    });
}

export function assertPerformanceReviewCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.PERFORMANCE_REVIEW,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PERFORMANCE_CREATE,
    });
}

export function assertPerformanceGoalUpdater(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.PERFORMANCE_GOAL,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PERFORMANCE_UPDATE,
    });
}

export function assertPerformanceFeedbackProvider(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.PERFORMANCE_FEEDBACK,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PERFORMANCE_FEEDBACK,
    });
}

export function assertPrivilegedPerformanceActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.PERFORMANCE_MANAGEMENT,
        'You do not have permission to manage performance reviews.',
    );
}
