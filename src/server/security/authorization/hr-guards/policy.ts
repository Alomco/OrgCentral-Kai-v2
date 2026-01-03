/**
 * HR Policy Guards
 *
 * Guards for policy document management operations.
 *
 * @module hr-guards/policy
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

export function canManagePolicies(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.POLICY_MANAGEMENT);
}

export function assertPolicyReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.POLICY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.POLICY_READ,
    });
}

export function assertPolicyCreator(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE_TYPE.POLICY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.POLICY_CREATE,
    });
}

export function assertPolicyUpdater(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.POLICY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.POLICY_UPDATE,
    });
}

export function assertPolicyPublisher(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.PUBLISH,
        resourceType: HR_RESOURCE_TYPE.POLICY,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.POLICY_PUBLISH,
    });
}

export function assertPolicyAcknowledger(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.ACKNOWLEDGE,
        resourceType: HR_RESOURCE_TYPE.POLICY_ACKNOWLEDGMENT,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.POLICY_ACKNOWLEDGE,
    });
}

export function assertPrivilegedPolicyActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.POLICY_MANAGEMENT,
        'You do not have permission to manage HR policies.',
    );
}
