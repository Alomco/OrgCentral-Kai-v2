import type { GuardMembershipRecord } from '@/server/repositories/contracts/security';
import { isJsonObject } from '@/server/repositories/prisma/helpers/prisma-utils';
import type { OrgPermissionMap } from '@/server/security/access-control';
import type { Prisma } from '@prisma/client';

export const guardMembershipInclude = {
    org: {
        select: {
            id: true,
            name: true,
            dataResidency: true,
            dataClassification: true,
        },
    },
    role: { select: { name: true, scope: true, permissions: true } },
} satisfies Prisma.MembershipInclude;

export type GuardMembershipWithOrg = Prisma.MembershipGetPayload<{
    include: typeof guardMembershipInclude;
}>;

function normalizePermissionMap(value: unknown): OrgPermissionMap | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const record = value as Record<string, unknown>;
    const result: OrgPermissionMap = {};

    for (const [resource, actions] of Object.entries(record)) {
        if (!Array.isArray(actions)) {
            continue;
        }

        const filtered = actions.filter((action): action is string => typeof action === 'string' && action.length > 0);
        if (filtered.length > 0) {
            result[resource] = filtered;
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

export function mapPrismaGuardMembershipToRecord(record: GuardMembershipWithOrg): GuardMembershipRecord {
    const metadata = isJsonObject(record.metadata)
        ? (record.metadata as Record<string, unknown>)
        : null;

    const rolePermissions = record.role
        ? normalizePermissionMap(
            isJsonObject(record.role.permissions)
                ? (record.role.permissions as Record<string, unknown>)
                : null,
        )
        : null;

    return {
        orgId: record.orgId,
        userId: record.userId,
        status: record.status,
        roleId: record.roleId ?? null,
        roleName: record.role ? record.role.name : null,
        roleScope: record.role ? record.role.scope : null,
        rolePermissions,
        departmentId: record.departmentId ?? null,
        metadata,
        organization: {
            id: record.org.id,
            name: record.org.name,
            dataResidency: record.org.dataResidency,
            dataClassification: record.org.dataClassification,
        },
    };
}
