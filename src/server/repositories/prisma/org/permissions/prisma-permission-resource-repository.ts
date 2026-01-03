import type { Prisma } from '@prisma/client';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import { getModelDelegate } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapPrismaPermissionResourceToDomain } from '@/server/repositories/mappers/org/permissions/permission-resource-mapper';
import type { PermissionResource } from '@/server/types/security-types';

export class PrismaPermissionResourceRepository
    extends OrgScopedPrismaRepository
    implements IPermissionResourceRepository {
    async listResources(orgId: string): Promise<PermissionResource[]> {
        const records = await getModelDelegate(this.prisma, 'permissionResource').findMany({
            where: { orgId },
            orderBy: { resource: 'asc' },
        });
        return records.map(mapPrismaPermissionResourceToDomain);
    }

    async getResource(orgId: string, resourceId: string): Promise<PermissionResource | null> {
        const record = await getModelDelegate(this.prisma, 'permissionResource').findUnique({
            where: { id: resourceId },
        });
        if (record?.orgId !== orgId) {
            return null;
        }
        return mapPrismaPermissionResourceToDomain(record);
    }

    async getResourceByName(orgId: string, resource: string): Promise<PermissionResource | null> {
        const record = await getModelDelegate(this.prisma, 'permissionResource').findUnique({
            where: { orgId_resource: { orgId, resource } },
        });
        return record ? mapPrismaPermissionResourceToDomain(record) : null;
    }

    async createResource(
        orgId: string,
        input: Omit<PermissionResource, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<void> {
        const data: Prisma.PermissionResourceUncheckedCreateInput = {
            orgId,
            resource: input.resource,
            actions: input.actions,
            description: input.description ?? null,
            metadata: input.metadata as Prisma.InputJsonValue | undefined,
        };
        await getModelDelegate(this.prisma, 'permissionResource').create({ data });
    }

    async updateResource(
        orgId: string,
        resourceId: string,
        updates: Partial<Omit<PermissionResource, 'id' | 'orgId' | 'createdAt'>>,
    ): Promise<void> {
        const existing = await getModelDelegate(this.prisma, 'permissionResource').findUnique({ where: { id: resourceId } });
        this.assertOrgRecord(existing, orgId);
        const data: Prisma.PermissionResourceUncheckedUpdateInput = {
            resource: updates.resource,
            actions: updates.actions,
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            metadata: updates.metadata as Prisma.InputJsonValue | undefined,
        };
        await getModelDelegate(this.prisma, 'permissionResource').update({ where: { id: resourceId }, data });
    }

    async deleteResource(orgId: string, resourceId: string): Promise<void> {
        const existing = await getModelDelegate(this.prisma, 'permissionResource').findUnique({ where: { id: resourceId } });
        this.assertOrgRecord(existing, orgId);
        await getModelDelegate(this.prisma, 'permissionResource').delete({ where: { id: resourceId } });
    }
}
