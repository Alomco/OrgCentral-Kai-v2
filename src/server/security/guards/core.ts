import { randomUUID } from 'node:crypto';

import type { OrganizationData } from '@/server/types/leave-types';
import type { DataClassificationLevel, DataResidencyZone, TenantScope } from '@/server/types/tenant';
import { isOrgRoleKey, type OrgPermissionMap, type OrgRoleKey } from '@/server/security/access-control';
import type { RoleScope } from '@prisma/client';
import {
    authorizeOrgAccessAbacOnly,
    authorizeOrgAccessRbacOnly,
} from '@/server/security/authorization/engine';

import { getGuardMembershipRepository } from './membership-repository';
import { getPermissionResolutionService } from '@/server/services/security/permission-resolution-service.provider';

export interface OrgAccessInput {
    orgId: string;
    userId: string;
    requiredPermissions?: OrgPermissionMap;
    /** Alternative to multi-role gates: any one of these permission sets must be satisfied. */
    requiredAnyPermissions?: readonly OrgPermissionMap[];
    expectedClassification?: DataClassificationLevel;
    expectedResidency?: DataResidencyZone;
    auditSource?: string;
    correlationId?: string;
    // ABAC fields
    action?: string;
    resourceType?: string;
    resourceAttributes?: Record<string, unknown>;
}

export interface OrgAccessContext {
    orgId: string;
    userId: string;
    roleKey: OrgRoleKey | 'custom';
    roleName?: string | null;
    roleId?: string | null;
    roleScope?: RoleScope | null;
    /** Effective RBAC permissions resolved from role definitions + inheritance. */
    permissions: OrgPermissionMap;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    auditBatchId?: string;
    correlationId: string;
}

export function toTenantScope(context: OrgAccessContext): TenantScope {
    return {
        orgId: context.orgId,
        dataResidency: context.dataResidency,
        dataClassification: context.dataClassification,
        auditSource: context.auditSource,
        auditBatchId: context.auditBatchId,
    };
}

export function organizationToTenantScope(org: OrganizationData): TenantScope {
    return {
        orgId: org.id,
        dataResidency: org.dataResidency,
        dataClassification: org.dataClassification,
        auditSource: org.auditSource,
        auditBatchId: org.auditBatchId,
    };
}

export async function assertOrgAccess(input: OrgAccessInput): Promise<OrgAccessContext> {
    if (!input.orgId || !input.userId) {
        throw new Error('orgId and userId are required for guard evaluation.');
    }

    const membership = await getGuardMembershipRepository().findMembership(input.orgId, input.userId);

    if (!membership) {
        throw new Error('Membership not found for the requested organization.');
    }

    if (membership.status !== 'ACTIVE') {
        throw new Error('Membership is not active for the requested organization.');
    }

    const knownRole = resolveRoleKey(membership.roleName);

    const dataResidency = membership.organization.dataResidency;
    const dataClassification = membership.organization.dataClassification;

    const grantedPermissions = await getPermissionResolutionService().resolveMembershipPermissions(membership);

    const context: OrgAccessContext = {
        orgId: input.orgId,
        userId: input.userId,
        roleKey: knownRole,
        roleName: membership.roleName ?? null,
        roleId: membership.roleId ?? null,
        roleScope: membership.roleScope ?? null,
        permissions: grantedPermissions,
        dataResidency,
        dataClassification,
        auditSource: input.auditSource ?? 'org-guard',
        auditBatchId: extractAuditBatchId(membership.metadata),
        correlationId: input.correlationId ?? randomUUID(),
    };

    authorizeOrgAccessRbacOnly(input, context);

    return context;
}

export async function withOrgContext<T>(
    input: OrgAccessInput,
    handler: (context: OrgAccessContext) => Promise<T>,
): Promise<T> {
    const context = await assertOrgAccess(input);
    return handler(context);
}

function resolveRoleKey(roleName?: string | null): OrgRoleKey | 'custom' {
    if (!roleName) {
        return 'custom';
    }
    return isOrgRoleKey(roleName) ? roleName : 'custom';
}

function extractAuditBatchId(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') {
        return undefined;
    }

    const value = metadata as Record<string, unknown>;
    return typeof value.auditBatchId === 'string' ? value.auditBatchId : undefined;
}

/**
 * Combines RBAC guard with ABAC evaluation.
 * Use this where the action requires attribute checks against a resource (e.g., doc owner/department)
 */
export async function assertOrgAccessWithAbac(input: OrgAccessInput): Promise<OrgAccessContext> {
    const context = await assertOrgAccess(input);

    await authorizeOrgAccessAbacOnly(input, context);
    return context;
}
