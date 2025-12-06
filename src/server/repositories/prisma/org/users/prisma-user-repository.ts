import type { Prisma, Membership as PrismaMembership, Organization } from '@prisma/client';
import { MembershipStatus } from '@prisma/client';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import { getModelDelegate } from '@/server/repositories/prisma/helpers/prisma-utils';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import { mapPrismaUserToDomain } from '@/server/repositories/mappers/org/users/user-mapper';
import { mapPrismaMembershipToDomain } from '@/server/repositories/mappers/org/membership/membership-mapper';
import type { UserData } from '@/server/types/leave-types';
import type { User } from '@/server/types/hr-types';
import type { Membership } from '@/server/types/membership';
import type { UserFilters, UserCreationData, UserUpdateData } from './prisma-user-repository.types';

export class PrismaUserRepository extends OrgScopedPrismaRepository implements IUserRepository {

  async findById(id: string): Promise<User | null> {
    const rec = await getModelDelegate(this.prisma, 'user').findUnique({ where: { id } });
    if (!rec) { return null; }
    return mapPrismaUserToDomain(rec);
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    const rec = await getModelDelegate(this.prisma, 'user').findUnique({ where: { email: normalizedEmail } });
    if (!rec) { return null; }
    return mapPrismaUserToDomain(rec);
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    const rec = await getModelDelegate(this.prisma, 'user').findFirst({ where: { email: normalizedEmail } });
    return Boolean(rec);
  }

  async findAll(filters?: UserFilters): Promise<User[]> {
    const whereClause: Prisma.UserWhereInput = {};

    if (filters?.email) {
      whereClause.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters?.status) {
      whereClause.status = { equals: filters.status };
    }

    const records = await getModelDelegate(this.prisma, 'user').findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
    return records.map((r) => mapPrismaUserToDomain(r));
  }

  async create(data: UserCreationData): Promise<User> {
    const rec = await getModelDelegate(this.prisma, 'user').create({ data: { ...data, status: MembershipStatus.INVITED } });
    return mapPrismaUserToDomain(rec);
  }

  async update(id: string, data: UserUpdateData): Promise<User> {
    const rec = await getModelDelegate(this.prisma, 'user').update({
      where: { id },
      data,
    });
    return mapPrismaUserToDomain(rec);
  }

  async delete(id: string): Promise<User> {
    const rec = await getModelDelegate(this.prisma, 'user').delete({
      where: { id },
    });
    return mapPrismaUserToDomain(rec);
  }

  async incrementFailedLogin(id: string): Promise<User> {
    return getModelDelegate(this.prisma, 'user').update({
      where: { id },
      data: {
        failedLoginCount: {
          increment: 1
        }
      }
    });
  }

  async resetFailedLogin(id: string): Promise<User> {
    return getModelDelegate(this.prisma, 'user').update({
      where: { id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null
      }
    });
  }

  // --- IUserRepository implementation ---
  async getUser(tenantId: string, userId: string): Promise<UserData | null> {
    const user = await getModelDelegate(this.prisma, 'user').findUnique({ where: { id: userId } });
    if (!user) { return null; }

    // Find memberships for the user that belong to the tenant
    const memberships = await getModelDelegate(this.prisma, 'membership').findMany({ where: { userId, orgId: tenantId }, include: { org: true } });

    const domainUser = mapPrismaUserToDomain(user);

    const domainMemberships = memberships.map((m) => mapPrismaMembershipToDomain(m as PrismaMembership & { org?: Organization | null }));

    const rolesByOrg: Record<string, string[]> = {};
    const memberOf: string[] = [];
    for (const mem of domainMemberships) {
      memberOf.push(mem.organizationId);
      rolesByOrg[mem.organizationId] = mem.roles;
    }

    return {
      id: domainUser.id,
      email: domainUser.email,
      displayName: domainUser.displayName ?? '',
      roles: [],
      memberships: domainMemberships,
      memberOf,
      rolesByOrg,
      createdAt: domainUser.createdAt.toISOString(),
      updatedAt: domainUser.updatedAt.toISOString(),
    };
  }

  async updateUserMemberships(tenantId: string, userId: string, memberships: Membership[]): Promise<void> {
    // replace existing memberships for the tenant and user
    await this.prisma.$transaction(async (tx) => {
      await getModelDelegate(tx, 'membership').deleteMany({ where: { orgId: tenantId, userId } });
      for (const mem of memberships) {
        await getModelDelegate(tx, 'membership').create({ data: { orgId: mem.organizationId, userId, status: MembershipStatus.ACTIVE, metadata: { roles: mem.roles }, invitedBy: null, invitedAt: new Date(), activatedAt: new Date(), createdBy: '' } });
      }
    });
  }

  async addUserToOrganization(tenantId: string, userId: string, organizationId: string, organizationName: string, roles: string[]): Promise<void> {
    await getModelDelegate(this.prisma, 'membership').upsert({
      where: { orgId_userId: { orgId: organizationId, userId } as Prisma.MembershipOrgIdUserIdCompoundUniqueInput },
      create: { orgId: organizationId, userId, status: MembershipStatus.ACTIVE, metadata: { roles }, createdBy: '' },
      update: { metadata: { roles } as Prisma.InputJsonValue },
    });
  }

  async removeUserFromOrganization(tenantId: string, userId: string, organizationId: string): Promise<void> {
    await getModelDelegate(this.prisma, 'membership').delete({ where: { orgId_userId: { orgId: organizationId, userId } as Prisma.MembershipOrgIdUserIdCompoundUniqueInput } });
  }

  async getUsersInOrganization(tenantId: string, organizationId: string): Promise<UserData[]> {
    const memberships = await getModelDelegate(this.prisma, 'membership').findMany({ where: { orgId: organizationId }, include: { user: true } });
    const results: UserData[] = [];
    for (const mem of memberships) {
      const user = mem.user;
      const domainUser = mapPrismaUserToDomain(user);
      const domainMembership: Membership = mapPrismaMembershipToDomain(mem as PrismaMembership & { org?: Organization | null });
      results.push({
        id: domainUser.id,
        email: domainUser.email,
        displayName: domainUser.displayName ?? '',
        roles: [],
        memberships: [domainMembership],
        memberOf: [domainMembership.organizationId],
        rolesByOrg: { [domainMembership.organizationId]: domainMembership.roles },
        createdAt: domainUser.createdAt.toISOString(),
        updatedAt: domainUser.updatedAt.toISOString(),
      });
    }
    return results;
  }
}
