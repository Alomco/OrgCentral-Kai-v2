import type { PermissionResource } from '@/server/types/security-types';
import type { PermissionResource as PrismaPermissionResource } from '@prisma/client';

export function mapPrismaPermissionResourceToDomain(record: PrismaPermissionResource): PermissionResource {
    return {
        id: record.id,
        orgId: record.orgId,
        resource: record.resource,
        actions: record.actions,
        description: record.description,
        metadata: record.metadata,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}
