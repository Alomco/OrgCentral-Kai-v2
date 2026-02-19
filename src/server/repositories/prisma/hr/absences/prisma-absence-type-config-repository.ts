import type { Prisma } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import { mapDomainAbsenceTypeConfigToPrismaCreate, mapDomainAbsenceTypeConfigToPrismaUpdate, mapPrismaAbsenceTypeConfigToDomain } from '@/server/repositories/mappers/hr/absences/absences-mapper';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import { AuthorizationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export class PrismaAbsenceTypeConfigRepository extends BasePrismaRepository implements IAbsenceTypeConfigRepository {
  async createConfig(
    contextOrOrgId: RepositoryAuthorizationContext | string,
    input: Omit<AbsenceTypeConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AbsenceTypeConfig> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'absence_type_config');
    this.validateTenantWriteAccess(context, context.orgId, 'write');
    const data = mapDomainAbsenceTypeConfigToPrismaCreate({ ...input, orgId: context.orgId });
    const created = await this.prisma.absenceTypeConfig.create({ data });
    return mapPrismaAbsenceTypeConfigToDomain(this.assertTenantRecord(created, context, 'absence_type_config'));
  }

  async updateConfig(
    contextOrOrgId: RepositoryAuthorizationContext | string,
    id: string,
    updates: Partial<Pick<AbsenceTypeConfig, 'label' | 'tracksBalance' | 'isActive' | 'metadata'>>,
  ): Promise<AbsenceTypeConfig> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'absence_type_config');
    this.validateTenantWriteAccess(context, context.orgId, 'update');
    const data = mapDomainAbsenceTypeConfigToPrismaUpdate(updates);
    await this.prisma.absenceTypeConfig.updateMany({
      where: { id, orgId: context.orgId },
      data,
    });

    const updated = await this.prisma.absenceTypeConfig.findFirst({
      where: { id, orgId: context.orgId },
    });
    if (!updated) {
      throw new AuthorizationError('Absence type config not found for this organization.', { orgId: context.orgId });
    }
    return mapPrismaAbsenceTypeConfigToDomain(this.assertTenantRecord(updated, context, 'absence_type_config'));
  }

  async getConfig(contextOrOrgId: RepositoryAuthorizationContext | string, id: string): Promise<AbsenceTypeConfig | null> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'absence_type_config');
    const rec = await this.prisma.absenceTypeConfig.findFirst({ where: { id, orgId: context.orgId } });
    return rec ? mapPrismaAbsenceTypeConfigToDomain(this.assertTenantRecord(rec, context, 'absence_type_config')) : null;
  }

  async getConfigByKey(contextOrOrgId: RepositoryAuthorizationContext | string, key: string): Promise<AbsenceTypeConfig | null> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'absence_type_config');
    const rec = await this.prisma.absenceTypeConfig.findFirst({ where: { orgId: context.orgId, key } });
    return rec ? mapPrismaAbsenceTypeConfigToDomain(this.assertTenantRecord(rec, context, 'absence_type_config')) : null;
  }

  async getConfigs(contextOrOrgId: RepositoryAuthorizationContext | string, options?: { includeInactive?: boolean }): Promise<AbsenceTypeConfig[]> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'absence_type_config');
    const where: Prisma.AbsenceTypeConfigWhereInput = { orgId: context.orgId };
    if (!options?.includeInactive) {
      where.isActive = true;
    }
    const recs = await this.prisma.absenceTypeConfig.findMany({ where, orderBy: { label: 'asc' } });
    return recs.map((rec) => mapPrismaAbsenceTypeConfigToDomain(this.assertTenantRecord(rec, context, 'absence_type_config')));
  }
}
