import { randomUUID } from 'node:crypto';
import type { OrganizationData } from '@/server/types/leave-types';
import type { DataClassificationLevel, DataResidencyZone, TenantScope } from '@/server/types/tenant';
import {
    combineRoleStatements,
    orgRoles,
    type OrgPermissionMap,
    type OrgRoleKey,
} from './access-control';
import { evaluateAbac, makeSubject } from './abac';
import type { IGuardMembershipRepository } from '@/server/repositories/contracts/security/guard-membership-repository-contract';
import { PrismaGuardMembershipRepository } from '@/server/repositories/prisma/security/guard/prisma-guard-membership-repository';

const classificationRank: Record<DataClassificationLevel, number> = {
    OFFICIAL: 1,
    OFFICIAL_SENSITIVE: 2,
    SECRET: 3,
    TOP_SECRET: 4,
};

const defaultGuardMembershipRepository: IGuardMembershipRepository =
    new PrismaGuardMembershipRepository();

let guardMembershipRepository: IGuardMembershipRepository = defaultGuardMembershipRepository;

/**
 * Test-only hook for swapping the guard membership repository.
 * Avoids mutable global state in production paths.
 */
export function __setGuardMembershipRepositoryForTests(repository: IGuardMembershipRepository): void {
    guardMembershipRepository = repository;
}

export function __resetGuardMembershipRepositoryForTests(): void {
    guardMembershipRepository = defaultGuardMembershipRepository;
}

export interface OrgAccessInput {
    orgId: string;
    userId: string;
    requiredRoles?: OrgRoleKey[];
    requiredPermissions?: OrgPermissionMap;
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

export async function assertOrgAccess(input: OrgAccessInput): Promise<OrgAccessContext> {
    if (!input.orgId || !input.userId) {
        throw new Error('orgId and userId are required for guard evaluation.');
    }

    const membership = await guardMembershipRepository.findMembership(input.orgId, input.userId);

    if (!membership) {
        throw new Error('Membership not found for the requested organization.');
    }

    const dataResidency = membership.organization.dataResidency;
    const dataClassification = membership.organization.dataClassification;

    if (
        input.expectedClassification &&
        classificationRank[dataClassification] < classificationRank[input.expectedClassification]
    ) {
        throw new Error('User clearance is insufficient for this classification.');
    }

    if (input.expectedResidency && input.expectedResidency !== dataResidency) {
        throw new Error('Requested residency zone mismatch.');
    }

    const permissions = mergePermissionRequirements(
        input.requiredPermissions,
        input.requiredRoles,
    );
    const knownRole = resolveRoleKey(membership.roleName);

    if (Object.keys(permissions).length > 0 && !roleSatisfiesPermissions(knownRole, permissions)) {
        throw new Error('RBAC check failed for the requested action.');
    }

    return {
        orgId: input.orgId,
        userId: input.userId,
        roleKey: knownRole,
        dataResidency,
        dataClassification,
        auditSource: input.auditSource ?? 'org-guard',
        auditBatchId: extractAuditBatchId(membership.metadata),
        correlationId: input.correlationId ?? randomUUID(),
    };
}

export async function withOrgContext<T>(
    input: OrgAccessInput,
    handler: (context: OrgAccessContext) => Promise<T>,
): Promise<T> {
    const context = await assertOrgAccess(input);
    return handler(context);
}

function mergePermissionRequirements(
    directPermissions?: OrgPermissionMap,
    roleKeys?: OrgRoleKey[],
): Record<string, string[]> {
    const permissionSource: Record<string, string[]> = {};

    if (directPermissions) {
        for (const [resource, actions] of Object.entries(directPermissions)) {
            const actionList = Array.isArray(actions) ? actions : [];
            if (actionList.length === 0) {
                continue;
            }
            permissionSource[resource] = [...actionList];
        }
    }

    if (roleKeys?.length) {
        const fromRoles = combineRoleStatements(roleKeys);
        for (const [resource, actions] of Object.entries(fromRoles)) {
            const actionList = Array.isArray(actions) ? actions : [];
            if (actionList.length === 0) {
                continue;
            }
            const existing = permissionSource[resource] ?? [];
            permissionSource[resource] = Array.from(new Set([...existing, ...actionList]));
        }
    }

    return permissionSource;
}

function roleSatisfiesPermissions(
    roleKey: OrgRoleKey | 'custom',
    requirements: Record<string, string[]>,
): boolean {
    if (roleKey === 'custom') {
        return false;
    }

    const statements = orgRoles[roleKey].statements;

    return Object.entries(requirements).every(([resource, actions]) => {
        if (!actions.length) {
            return true;
        }

        const allowed = (statements as Record<string, string[]>)[resource] ?? [];
        return actions.every((action) => allowed.includes(action as never));
    });
}

function resolveRoleKey(roleName?: string | null): OrgRoleKey | 'custom' {
    if (!roleName) {
        return 'custom';
    }
    const normalized = roleName as OrgRoleKey;
    return normalized in orgRoles ? normalized : 'custom';
}

function extractAuditBatchId(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') {
        return undefined;
    }

    const value = metadata as Record<string, unknown>;
    return typeof value.auditBatchId === 'string' ? value.auditBatchId : undefined;
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

/**
 * Combines RBAC guard with ABAC evaluation.
 * Use this where the action requires attribute checks against a resource (e.g., doc owner/department)
 */
export async function assertOrgAccessWithAbac(input: OrgAccessInput): Promise<OrgAccessContext> {
    const context = await assertOrgAccess(input);
    if (input.action && input.resourceType) {
        const subject = makeSubject(input.orgId, input.userId, [context.roleKey === 'custom' ? 'custom' : context.roleKey]);
        const allowed = await evaluateAbac(input.orgId, input.action, input.resourceType, subject, input.resourceAttributes ?? {});
        if (!allowed) {
            throw new Error('ABAC policy denied this action.');
        }
    }
    return context;
}
