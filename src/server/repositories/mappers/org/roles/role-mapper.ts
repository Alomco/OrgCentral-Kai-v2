/**
 * Mappers for Role entities
 * Converts between domain models and Prisma/client models
 */
import type { Role } from '@/server/types/hr-types';
import type { Role as PrismaRole } from '@prisma/client';

export function mapPrismaRoleToDomain(record: PrismaRole): Role {
    return {
        id: record.id,
        orgId: record.orgId,
        name: record.name,
        description: record.description,
        scope: record.scope,
        permissions: record.permissions,
        inheritsRoleIds: record.inheritsRoleIds,
        isSystem: record.isSystem,
        isDefault: record.isDefault,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

export function mapDomainRoleToPrisma(input: Role): PrismaRole {
    return {
        id: input.id,
        orgId: input.orgId,
        name: input.name,
        description: input.description ?? null,
        scope: input.scope,
        permissions: input.permissions,
        inheritsRoleIds: input.inheritsRoleIds ?? [],
        isSystem: input.isSystem ?? false,
        isDefault: input.isDefault ?? false,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
    };
}
