import { type Prisma, type Role as PrismaRole } from '@prisma/client';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { Role } from '@/server/types/hr-types';
import { mapPrismaRoleToDomain } from '@/server/repositories/mappers/org/roles/role-mapper';

export class PrismaRoleRepository extends OrgScopedPrismaRepository implements IRoleRepository {
  // No explicit constructor required — BasePrismaRepository enforces injection

  // Contract-facing method (domain Role)
  async getRole(tenantId: string, roleId: string): Promise<Role | null> {
    const record = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!record) {
      return null;
    }
    if (record.orgId !== tenantId) {
      return null;
    }
    return mapPrismaRoleToDomain(record);
  }

  // Back-compat wrapper for existing usages
  async findById(id: string): Promise<PrismaRole | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async getRoleByName(tenantId: string, name: string): Promise<Role | null> {
    const record = await this.prisma.role.findUnique({
      where: {
        orgId_name: {
          orgId: tenantId,
          name,
        },
      },
    });
    if (!record) {
      return null;
    }
    return mapPrismaRoleToDomain(record);
  }

  async getRolesByOrganization(tenantId: string): Promise<Role[]> {
    // Note: Role model stores custom fields such as 'isCustom', 'isDefault', and 'status' in metadata
    // within the Prisma model. If filter-by-metadata is required, use a JSON query on `metadata`.
    const whereClause: Prisma.RoleWhereInput = { orgId: tenantId };
    const records = await this.prisma.role.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });

    return records.map((r) => mapPrismaRoleToDomain(r));
  }

  async createRole(tenantId: string, role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const createData: Prisma.RoleUncheckedCreateInput = {
      orgId: tenantId,
      name: role.name,
      description: role.description ?? null,
      permissions: role.permissions as Prisma.InputJsonValue,
      inheritsRoleIds: role.inheritsRoleIds ?? [],
      isSystem: role.isSystem ?? false,
      isDefault: role.isDefault ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.prisma.role.create({ data: createData });
  }

  async updateRole(tenantId: string, roleId: string, updates: Partial<Omit<Role, 'id' | 'orgId' | 'createdAt'>>): Promise<void> {
    // Ensure the role belongs to the tenant
    this.assertOrgRecord(await this.prisma.role.findUnique({ where: { id: roleId } }), tenantId);

    await this.prisma.role.update({ where: { id: roleId }, data: updates as Prisma.RoleUncheckedUpdateInput });
  }

  async getRolesByIds(tenantId: string, roleIds: string[]): Promise<Role[]> {
    if (!roleIds.length) {
      return [];
    }
    const records = await this.prisma.role.findMany({
      where: { orgId: tenantId, id: { in: roleIds } },
    });
    return records.map((record) => mapPrismaRoleToDomain(record));
  }

  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    // Ensure the role belongs to the tenant
    this.assertOrgRecord(await this.prisma.role.findUnique({ where: { id: roleId } }), tenantId);

    await this.prisma.role.delete({ where: { id: roleId } });
  }
}
