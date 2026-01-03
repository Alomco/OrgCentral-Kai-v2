import type { Prisma, Membership as PrismaMembership, Organization } from '@prisma/client';
import { MembershipStatus } from '@prisma/client';
import { OrgScopedPrismaRepository } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import {
  getModelDelegate,
  type PrismaClientBase,
  buildMembershipMetadataJson,
} from '@/server/repositories/prisma/helpers/prisma-utils';
import type {
  IUserRepository,
  UserListFilters,
  UserPagedQuery,
  UserSortInput,
} from '@/server/repositories/contracts/org/users/user-repository-contract';
import { mapPrismaUserToDomain } from '@/server/repositories/mappers/org/users/user-mapper';
import { mapPrismaMembershipToDomain } from '@/server/repositories/mappers/org/membership/membership-mapper';
import type { UserData } from '@/server/types/leave-types';
import type { User } from '@/server/types/hr-types';
import type { Membership } from '@/server/types/membership';
import type { UserFilters, UserCreationData, UserUpdateData } from './prisma-user-repository.types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

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
    const memberships = await getModelDelegate(this.prisma, 'membership').findMany({
      where: { userId, orgId: tenantId },
      include: { org: true, role: { select: { name: true } } },
    });

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

  async updateUserMemberships(context: RepositoryAuthorizationContext, userId: string, memberships: Membership[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const mem of memberships) {
        if (mem.organizationId !== context.orgId) {
          continue;
        }

        const primaryRoleId = await resolvePrimaryRoleId(tx, context.orgId, mem.roles);
        const now = new Date();

        await getModelDelegate(tx, 'membership').upsert({
          where: { orgId_userId: { orgId: context.orgId, userId } as Prisma.MembershipOrgIdUserIdCompoundUniqueInput },
          update: {
            roleId: primaryRoleId ?? undefined,
            metadata: buildMembershipMetadataJson(context.tenantScope),
            updatedBy: context.userId,
          },
          create: {
            orgId: context.orgId,
            userId,
            status: MembershipStatus.ACTIVE,
            roleId: primaryRoleId ?? undefined,
            metadata: buildMembershipMetadataJson(context.tenantScope),
            invitedBy: null,
            invitedAt: now,
            activatedAt: now,
            createdBy: context.userId,
            updatedBy: context.userId,
          },
        });
      }
    });
  }

  async addUserToOrganization(
    context: RepositoryAuthorizationContext,
    userId: string,
    organizationId: string,
    organizationName: string,
    roles: string[],
  ): Promise<void> {
    void organizationName;
    if (organizationId !== context.orgId) {
      return;
    }
    const primaryRoleId = await resolvePrimaryRoleId(this.prisma, organizationId, roles);
    await getModelDelegate(this.prisma, 'membership').upsert({
      where: { orgId_userId: { orgId: organizationId, userId } as Prisma.MembershipOrgIdUserIdCompoundUniqueInput },
      create: {
        orgId: organizationId,
        userId,
        status: MembershipStatus.ACTIVE,
        roleId: primaryRoleId ?? undefined,
        metadata: buildMembershipMetadataJson(context.tenantScope),
        createdBy: context.userId,
      },
      update: {
        roleId: primaryRoleId ?? undefined,
        metadata: buildMembershipMetadataJson(context.tenantScope),
        updatedBy: context.userId,
      },
    });
  }

  async removeUserFromOrganization(context: RepositoryAuthorizationContext, userId: string, organizationId: string): Promise<void> {
    if (organizationId !== context.orgId) {
      return;
    }
    await getModelDelegate(this.prisma, 'membership').delete({
      where: { orgId_userId: { orgId: organizationId, userId } as Prisma.MembershipOrgIdUserIdCompoundUniqueInput },
    });
  }

  async getUsersInOrganization(context: RepositoryAuthorizationContext, organizationId: string): Promise<UserData[]> {
    if (organizationId !== context.orgId) {
      return [];
    }
    const memberships = await getModelDelegate(this.prisma, 'membership').findMany({
      where: { orgId: organizationId },
      include: { user: true, role: { select: { name: true } } },
    });
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

  async countUsersInOrganization(
    context: RepositoryAuthorizationContext,
    organizationId: string,
    filters?: UserListFilters,
  ): Promise<number> {
    if (organizationId !== context.orgId) {
      return 0;
    }
    const whereClause = buildUserMembershipWhere(organizationId, filters);
    return getModelDelegate(this.prisma, 'membership').count({
      where: whereClause,
    });
  }

  async getUsersInOrganizationPaged(
    context: RepositoryAuthorizationContext,
    organizationId: string,
    query: UserPagedQuery,
  ): Promise<UserData[]> {
    if (organizationId !== context.orgId) {
      return [];
    }

    const safePage = Math.max(1, Math.floor(query.page));
    const safePageSize = Math.max(1, Math.floor(query.pageSize));
    const skip = (safePage - 1) * safePageSize;

    const memberships = await getModelDelegate(this.prisma, 'membership').findMany({
      where: buildUserMembershipWhere(organizationId, query),
      include: { user: true, role: { select: { name: true } } },
      orderBy: buildUserMembershipOrderBy(query.sort),
      skip,
      take: safePageSize,
    });

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

async function resolvePrimaryRoleId(
  prisma: PrismaClientBase,
  orgId: string,
  roles: string[],
): Promise<string | null> {
  if (!roles.length) {
    return null;
  }
  const roleName = roles[0];
  const role = await getModelDelegate(prisma, 'role').findUnique({
    where: { orgId_name: { orgId, name: roleName } },
    select: { id: true },
  });
  return role?.id ?? null;
}

function buildUserMembershipWhere(
  organizationId: string,
  filters?: UserListFilters,
): Prisma.MembershipWhereInput {
  const searchValue = filters?.search?.trim() ?? '';
  const roleValue = filters?.role?.trim() ?? '';
  const whereClause: Prisma.MembershipWhereInput = {
    orgId: organizationId,
  };

  if (filters?.status) {
    whereClause.status = filters.status;
  }

  if (roleValue) {
    whereClause.role = { name: roleValue };
  }

  if (searchValue) {
    whereClause.user = {
      OR: [
        { email: { contains: searchValue, mode: 'insensitive' } },
        { displayName: { contains: searchValue, mode: 'insensitive' } },
      ],
    };
  }

  return whereClause;
}

function buildUserMembershipOrderBy(
  sort?: UserSortInput,
): Prisma.MembershipOrderByWithRelationInput[] {
  const direction = sort?.direction ?? 'asc';

  if (!sort) {
    return [{ user: { email: 'asc' } }];
  }

  switch (sort.key) {
    case 'name':
      return [
        { user: { displayName: direction } },
        { user: { email: 'asc' } },
      ];
    case 'email':
      return [{ user: { email: direction } }];
    case 'status':
      return [
        { status: direction },
        { user: { email: 'asc' } },
      ];
    case 'role':
      return [
        { role: { name: direction } },
        { user: { email: 'asc' } },
      ];
    default:
      return [{ user: { email: 'asc' } }];
  }
}
