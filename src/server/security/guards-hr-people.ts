import { randomUUID } from 'node:crypto';
import { requireAbacAllowance } from './authorization/abac-context';
import { authorizeOrgAccessRbacOnly } from './authorization/engine';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrgAccessContext } from '@/server/security/guards';
import {
    createHrPeopleAuthorizationDefaults,
} from '@/server/use-cases/hr/people/shared/repository-authorizer-helpers';
import { HR_ACTION, HR_RESOURCE } from './authorization/hr-resource-registry';
import type { OrgPermissionMap } from './access-control';

interface PeopleGuardRequest {
    authorization: RepositoryAuthorizationContext;
    resourceAttributes?: Record<string, unknown>;
    action?: string;
}

const BASE_DEFAULTS = createHrPeopleAuthorizationDefaults();

function resolveOwnerMatch(
    authorization: RepositoryAuthorizationContext,
    resourceAttributes?: Record<string, unknown>,
): boolean | undefined {
    if (!resourceAttributes) {
        return undefined;
    }

    const explicit = resourceAttributes.ownerMatchesSubject;
    if (typeof explicit === 'boolean') {
        return explicit;
    }

    const ownerId = typeof resourceAttributes.ownerId === 'string'
        ? resourceAttributes.ownerId
        : undefined;
    const userId = typeof resourceAttributes.userId === 'string'
        ? resourceAttributes.userId
        : undefined;
    const candidate = ownerId ?? userId;

    if (!candidate) {
        return undefined;
    }

    return candidate === authorization.userId;
}

async function assertPeopleAccess(
    authorization: RepositoryAuthorizationContext,
    params: {
        action: string;
        resourceType: string;
        resourceAttributes?: Record<string, unknown>;
        requiredPermissions?: OrgPermissionMap;
    },
): Promise<RepositoryAuthorizationContext> {
    const ownerMatchesSubject = resolveOwnerMatch(authorization, params.resourceAttributes);
    authorizeOrgAccessRbacOnly(
        {
            orgId: authorization.orgId,
            userId: authorization.userId,
            requiredPermissions: params.requiredPermissions ?? BASE_DEFAULTS.requiredPermissions,
            expectedResidency: BASE_DEFAULTS.expectedResidency,
            expectedClassification: BASE_DEFAULTS.expectedClassification,
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
        guardContext: toOrgAccessContext(authorization),
        resourceAttributes: {
            ...params.resourceAttributes,
            ...(typeof ownerMatchesSubject === 'boolean'
                ? { ownerMatchesSubject }
                : {}),
            residency: authorization.dataResidency,
            classification: authorization.dataClassification,
            expectedResidency: BASE_DEFAULTS.expectedResidency,
            expectedClassification: BASE_DEFAULTS.expectedClassification,
        },
    });

    return authorization;
}

function toOrgAccessContext(
    authorization: RepositoryAuthorizationContext,
): OrgAccessContext {
    return {
        orgId: authorization.orgId,
        userId: authorization.userId,
        roleKey: authorization.roleKey,
        roleName: authorization.roleName ?? null,
        roleId: authorization.roleId ?? null,
        roleScope: authorization.roleScope ?? null,
        permissions: authorization.permissions,
        dataResidency: authorization.dataResidency,
        dataClassification: authorization.dataClassification,
        auditSource: authorization.auditSource,
        auditBatchId: authorization.auditBatchId,
        correlationId: authorization.correlationId ?? randomUUID(),
    };
}

export function assertPeopleProfileReader(
    request: PeopleGuardRequest,
): Promise<RepositoryAuthorizationContext> {
    return assertPeopleAccess(request.authorization, {
        action: request.action ?? HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: { [HR_RESOURCE.HR_EMPLOYEE_PROFILE]: [HR_ACTION.READ] },
    });
}

export function assertPeopleProfileEditor(
    request: PeopleGuardRequest,
): Promise<RepositoryAuthorizationContext> {
    return assertPeopleAccess(request.authorization, {
        action: request.action ?? HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: { [HR_RESOURCE.HR_EMPLOYEE_PROFILE]: [HR_ACTION.UPDATE] },
    });
}

export function assertEmploymentContractReader(
    request: PeopleGuardRequest,
): Promise<RepositoryAuthorizationContext> {
    return assertPeopleAccess(request.authorization, {
        action: request.action ?? HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_EMPLOYMENT_CONTRACT,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: { [HR_RESOURCE.HR_EMPLOYMENT_CONTRACT]: [HR_ACTION.READ] },
    });
}

export function assertEmploymentContractEditor(
    request: PeopleGuardRequest,
): Promise<RepositoryAuthorizationContext> {
    return assertPeopleAccess(request.authorization, {
        action: request.action ?? HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_EMPLOYMENT_CONTRACT,
        resourceAttributes: request.resourceAttributes,
        requiredPermissions: { [HR_RESOURCE.HR_EMPLOYMENT_CONTRACT]: [HR_ACTION.UPDATE] },
    });
}
