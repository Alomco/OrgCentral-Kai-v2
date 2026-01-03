/**
 * HR Onboarding Guards
 *
 * Guards for onboarding task and workflow operations.
 *
 * @module hr-guards/onboarding
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

export function canManageOnboarding(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.ONBOARDING_MANAGEMENT);
}

export function assertOnboardingReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.ONBOARDING_TASK,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.ONBOARDING_READ,
    });
}

export function assertOnboardingCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.ONBOARDING_TASK,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.ONBOARDING_CREATE,
    });
}

export function assertOnboardingUpdater(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.ONBOARDING_TASK,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.ONBOARDING_UPDATE,
    });
}

export function assertOnboardingCompleter(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.COMPLETE,
        resourceType: HR_RESOURCE_TYPE.ONBOARDING_TASK,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.ONBOARDING_COMPLETE,
    });
}

export function assertPrivilegedOnboardingActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.ONBOARDING_MANAGEMENT,
        'You do not have permission to manage onboarding tasks.',
    );
}
