/**
 * HR Compliance Guards
 *
 * Guards for compliance-related operations.
 *
 * @module hr-guards/compliance
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

export function canManageCompliance(context: RepositoryAuthorizationContext): boolean {
    return hasAnyPermission(context, HR_ANY_PERMISSION_PROFILE.COMPLIANCE_MANAGEMENT);
}

export function assertComplianceReader(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE_TYPE.COMPLIANCE_ITEM,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.COMPLIANCE_READ,
    });
}

export function assertComplianceUpdater(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE_TYPE.COMPLIANCE_ITEM,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.COMPLIANCE_UPDATE,
    });
}

export function assertComplianceReviewer(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.REVIEW,
        resourceType: HR_RESOURCE_TYPE.COMPLIANCE_REVIEW,
        resourceAttributes: request.resourceAttributes,
        anyOfPermissions: HR_ANY_PERMISSION_PROFILE.COMPLIANCE_MANAGEMENT,
    });
}

export function assertComplianceAssigner(request: HrGuardRequest): Promise<RepositoryAuthorizationContext> {
    return assertHrAccess(request.authorization, {
        action: HR_ACTION.ASSIGN,
        resourceType: HR_RESOURCE_TYPE.COMPLIANCE_ITEM,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: HR_PERMISSION_PROFILE.COMPLIANCE_ASSIGN,
    });
}

export function assertPrivilegedComplianceActor(context: RepositoryAuthorizationContext): void {
    assertPrivileged(
        context,
        HR_ANY_PERMISSION_PROFILE.COMPLIANCE_MANAGEMENT,
        'You do not have permission to manage organization compliance.',
    );
}
