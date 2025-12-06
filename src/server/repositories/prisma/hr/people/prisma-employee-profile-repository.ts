import type { EmployeeProfile as PrismaEmployeeProfile, Prisma } from '@prisma/client';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import { mapPrismaEmployeeProfileToDomain, buildPrismaCreateFromDomain, buildPrismaUpdateFromDomain, buildPrismaWhereFromFilters, normalizeEmployeeProfileMetadata } from '@/server/repositories/mappers/hr/people/employee-profile-mapper';
import type { EmployeeProfileDTO, PeopleListFilters } from '@/server/types/hr/people';
import type { EmployeeProfileFilters } from '@/server/repositories/mappers/hr/people/employee-profile-mapper';
import { EntityNotFoundError } from '@/server/errors';
import { HR_PEOPLE_CACHE_SCOPES } from '@/server/lib/cache-tags/hr-people';

export class PrismaEmployeeProfileRepository extends BasePrismaRepository implements IEmployeeProfileRepository {
  // BasePrismaRepository enforces DI
  constructor(options: BasePrismaRepositoryOptions = {}) {
    super(options);
  }

  async findById(orgId: string, userId: string): Promise<PrismaEmployeeProfile | null> {
    return this.prisma.employeeProfile.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });
  }

  async findAll(filters?: EmployeeProfileFilters): Promise<PrismaEmployeeProfile[]> {
    return this.prisma.employeeProfile.findMany({
      where: buildPrismaWhereFromFilters(filters),
      orderBy: { employeeNumber: 'asc' },
    });
  }

  async create(data: Prisma.EmployeeProfileUncheckedCreateInput): Promise<PrismaEmployeeProfile> {
    return this.prisma.employeeProfile.create({ data });
  }

  async update(orgId: string, userId: string, data: Prisma.EmployeeProfileUncheckedUpdateInput): Promise<PrismaEmployeeProfile> {
    return this.prisma.employeeProfile.update({ where: { orgId_userId: { orgId, userId } }, data });
  }

  async delete(orgId: string, userId: string): Promise<PrismaEmployeeProfile> {
    return this.prisma.employeeProfile.delete({ where: { orgId_userId: { orgId, userId } } });
  }

  // Contract wrappers
  async createEmployeeProfile(tenantId: string, profile: Omit<EmployeeProfileDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const createData: Prisma.EmployeeProfileUncheckedCreateInput = buildPrismaCreateFromDomain({ ...profile, orgId: tenantId });
    await this.create(createData);
    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.profiles]);
  }

  async updateEmployeeProfile(tenantId: string, profileId: string, updates: Partial<Omit<EmployeeProfileDTO, 'id' | 'orgId' | 'userId' | 'createdAt' | 'employeeNumber'>>): Promise<void> {
    const existing = await this.getProfileByIdEnsuringTenant(profileId, tenantId);
    const updateData: Prisma.EmployeeProfileUncheckedUpdateInput = buildPrismaUpdateFromDomain(updates);
    await this.update(existing.orgId, existing.userId, updateData);
    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.profiles]);
  }

  async getEmployeeProfile(tenantId: string, profileId: string): Promise<EmployeeProfileDTO | null> {
    const rec = await this.getProfileByIdEnsuringTenant(profileId, tenantId).catch(() => null);
    if (!rec) { return null; }
    return mapPrismaEmployeeProfileToDomain(rec);
  }

  async getEmployeeProfileByUser(tenantId: string, userId: string): Promise<EmployeeProfileDTO | null> {
    const rec = await this.findById(tenantId, userId);
    if (!rec) { return null; }
    return mapPrismaEmployeeProfileToDomain(rec);
  }

  async getEmployeeProfilesByOrganization(tenantId: string, filters?: PeopleListFilters): Promise<EmployeeProfileDTO[]> {
    const recs = await this.findAll({ orgId: tenantId, startDate: filters?.startDate, endDate: filters?.endDate });
    return recs.map((r) => mapPrismaEmployeeProfileToDomain(r));
  }

  async findByEmployeeNumber(
    tenantId: string,
    employeeNumber: string,
  ): Promise<EmployeeProfileDTO | null> {
    const rec = await this.prisma.employeeProfile.findUnique({
      where: {
        orgId_employeeNumber: {
          orgId: tenantId,
          employeeNumber,
        },
      },
    });

    return rec ? mapPrismaEmployeeProfileToDomain(rec) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<EmployeeProfileDTO | null> {
    const rec = await this.prisma.employeeProfile.findFirst({
      where: {
        orgId: tenantId,
        email: { equals: email, mode: 'insensitive' },
      },
    });

    return rec ? mapPrismaEmployeeProfileToDomain(rec) : null;
  }

  async linkProfileToUser(tenantId: string, employeeNumber: string, userId: string): Promise<void> {
    const existing = await this.prisma.employeeProfile.findUnique({
      where: {
        orgId_employeeNumber: {
          orgId: tenantId,
          employeeNumber,
        },
      },
    });

    if (!existing) {
      throw new EntityNotFoundError('Employee profile', { employeeNumber, orgId: tenantId });
    }

    if (existing.userId === userId) {
      return;
    }

    await this.prisma.employeeProfile.update({
      where: {
        orgId_employeeNumber: {
          orgId: tenantId,
          employeeNumber,
        },
      },
      data: {
        userId,
        updatedAt: new Date(),
      },
    });

    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.profiles]);
  }

  async updateComplianceStatus(tenantId: string, profileId: string, complianceStatus: string): Promise<void> {
    const existing = await this.getProfileByIdEnsuringTenant(profileId, tenantId);

    const nextMetadata = normalizeEmployeeProfileMetadata(existing.metadata);
    nextMetadata.complianceStatus = complianceStatus;

    await this.prisma.employeeProfile.update({
      where: { orgId_userId: { orgId: existing.orgId, userId: existing.userId } },
      data: {
        metadata: nextMetadata,
        updatedAt: new Date(),
      },
    });

    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.profiles]);
  }

  async deleteEmployeeProfile(tenantId: string, profileId: string): Promise<void> {
    const existing = await this.getProfileByIdEnsuringTenant(profileId, tenantId);
    await this.prisma.employeeProfile.delete({ where: { orgId_userId: { orgId: existing.orgId, userId: existing.userId } } });
    await this.invalidateAfterWrite(tenantId, [HR_PEOPLE_CACHE_SCOPES.profiles]);
  }

  private async getProfileByIdEnsuringTenant(profileId: string, tenantId: string): Promise<PrismaEmployeeProfile> {
    const rec = await this.prisma.employeeProfile.findUnique({ where: { id: profileId } });
    if (rec?.orgId !== tenantId) {
      throw new EntityNotFoundError('Employee profile', { profileId, orgId: tenantId });
    }
    return this.assertTenantRecord(rec, tenantId);
  }
}
