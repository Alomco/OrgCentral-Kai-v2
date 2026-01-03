/**
 * HR People Guards
 *
 * Guards for people/profile operations.
 *
 * @module hr-guards/people
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

export function canManagePeople(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.PEOPLE_MANAGEMENT);
}

export function assertProfileReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.EMPLOYEE_PROFILE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PROFILE_READ,
    });
}

export function assertProfileCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.EMPLOYEE_PROFILE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PROFILE_CREATE,
    });
}

export function assertProfileUpdater(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.EMPLOYEE_PROFILE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.PROFILE_UPDATE,
    });
}

export function assertContractReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.EMPLOYMENT_CONTRACT,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.CONTRACT_READ,
    });
}

export function assertPrivilegedPeopleActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.PEOPLE_MANAGEMENT,
        'You do not have permission to manage employee profiles.',
    );
}
