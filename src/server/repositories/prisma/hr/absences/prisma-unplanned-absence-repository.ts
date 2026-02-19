import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IUnplannedAbsenceRepository } from '@/server/repositories/contracts/hr/absences/unplanned-absence-repository-contract';
import {
  mapDomainUnplannedAbsenceToPrismaCreate,
  mapDomainUnplannedAbsenceToPrismaUpdate,
  mapPrismaUnplannedAbsenceToDomain,
} from '@/server/repositories/mappers/hr/absences/absences-mapper';
import type {
  AbsenceAttachmentInput,
  AbsenceDeletionAuditEntry,
  ReturnToWorkRecordInput,
  UnplannedAbsence,
} from '@/server/types/hr-ops-types';
import type { Prisma, PrismaClient } from '../../../../../generated/client';
import { EntityNotFoundError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

const ABSENCE_RELATIONS = {
  attachments: true,
  returnRecord: true,
  deletionAudit: true,
} as const;

type AbsenceRecordWithRelations = Prisma.UnplannedAbsenceGetPayload<{
  include: typeof ABSENCE_RELATIONS;
}>;

export class PrismaUnplannedAbsenceRepository extends BasePrismaRepository implements IUnplannedAbsenceRepository {

  async createAbsence(
    contextOrOrgId: RepositoryAuthorizationContext | string,
    input: Omit<UnplannedAbsence, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: UnplannedAbsence['status'] },
  ): Promise<UnplannedAbsence> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    this.validateTenantWriteAccess(context, input.orgId, 'write');
    const data = mapDomainUnplannedAbsenceToPrismaCreate({ ...input, orgId: context.orgId, status: input.status ?? 'REPORTED' });
    const rec = await this.prisma.unplannedAbsence.create({ data });
    this.assertTenantRecord(rec, context, 'unplanned_absence');
    this.validatePiiAccess(context, 'write', 'unplanned_absence');
    return mapPrismaUnplannedAbsenceToDomain(rec);
  }

  async updateAbsence(
    contextOrOrgId: RepositoryAuthorizationContext | string,
    id: string,
    updates: Parameters<IUnplannedAbsenceRepository['updateAbsence']>[2],
  ): Promise<UnplannedAbsence> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    this.validateTenantWriteAccess(context, context.orgId, 'update');
    const data = mapDomainUnplannedAbsenceToPrismaUpdate(updates);
    await this.prisma.unplannedAbsence.updateMany({ where: { id, orgId: context.orgId }, data });
    const rec = await this.prisma.unplannedAbsence.findFirst({ where: { id, orgId: context.orgId } });
    if (!rec) {
      throw new EntityNotFoundError('Absence', { absenceId: id, orgId: context.orgId });
    }
    this.validatePiiAccess(context, 'update', 'unplanned_absence');
    return mapPrismaUnplannedAbsenceToDomain(this.assertTenantRecord(rec, context, 'unplanned_absence'));
  }

  async getAbsence(contextOrOrgId: RepositoryAuthorizationContext | string, id: string): Promise<UnplannedAbsence | null> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    const rec = await this.prisma.unplannedAbsence.findFirst({
      where: { id, orgId: context.orgId },
      include: ABSENCE_RELATIONS,
    });
    return rec ? mapPrismaUnplannedAbsenceToDomain(this.assertTenantRecord(rec, context, 'unplanned_absence')) : null;
  }

  async listAbsences(
    contextOrOrgId: RepositoryAuthorizationContext | string,
    filters?: { userId?: string; status?: UnplannedAbsence['status']; includeClosed?: boolean; from?: Date; to?: Date },
  ): Promise<UnplannedAbsence[]> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    const where: Prisma.UnplannedAbsenceWhereInput = { orgId: context.orgId };
    const normalizedFilters = filters ?? {};
    const { userId, status, includeClosed, from, to } = normalizedFilters;

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    } else if (!includeClosed) {
      const statusFilter: Prisma.EnumAbsenceStatusFilter = { not: 'CLOSED' };
      where.status = statusFilter;
    }

    if (from || to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (from) {
        dateFilter.gte = from;
      }
      if (to) {
        dateFilter.lte = to;
      }
      where.startDate = dateFilter;
    }

    const recs = await this.prisma.unplannedAbsence.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: ABSENCE_RELATIONS,
    });
    return recs
      .map((rec) => this.assertTenantRecord(rec, context, 'unplanned_absence'))
      .map(mapPrismaUnplannedAbsenceToDomain);
  }

  async recordReturnToWork(contextOrOrgId: RepositoryAuthorizationContext | string, id: string, record: ReturnToWorkRecordInput): Promise<UnplannedAbsence> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    return this.prisma.$transaction(async (tx) => {
      const absence = await this.ensureAbsence(tx, context, id);
      const submittedAt = record.submittedAt ?? new Date();

      await tx.absenceReturnRecord.upsert({
        where: { absenceId: id },
        create: {
          orgId: context.orgId,
          absenceId: id,
          returnDate: record.returnDate,
          comments: record.comments ?? null,
          submittedByUserId: record.submittedByUserId,
          submittedAt,
          metadata: record.metadata ?? undefined,
          dataClassification: record.dataClassification,
          residencyTag: record.residencyTag,
        },
        update: {
          returnDate: record.returnDate,
          comments: record.comments ?? null,
          submittedByUserId: record.submittedByUserId,
          submittedAt,
          metadata: record.metadata ?? undefined,
          dataClassification: record.dataClassification,
          residencyTag: record.residencyTag,
        },
      });

      await tx.unplannedAbsence.updateMany({
        where: { id, orgId: context.orgId },
        data: {
          endDate: record.returnDate,
          status: absence.status === 'CANCELLED' ? absence.status : 'CLOSED',
        },
      });

      const updated = await this.ensureAbsence(tx, context, id);
      return mapPrismaUnplannedAbsenceToDomain(this.assertTenantRecord(updated, context, 'unplanned_absence'));
    });
  }

  async addAttachments(contextOrOrgId: RepositoryAuthorizationContext | string, id: string, attachments: readonly AbsenceAttachmentInput[]): Promise<UnplannedAbsence> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAbsence(tx, context, id);
      await tx.absenceAttachment.createMany({
        data: attachments.map((attachment) => ({
          orgId: context.orgId,
          absenceId: id,
          fileName: attachment.fileName,
          storageKey: attachment.storageKey,
          contentType: attachment.contentType,
          fileSize: attachment.fileSize,
          checksum: attachment.checksum ?? null,
          uploadedByUserId: attachment.uploadedByUserId,
          uploadedAt: attachment.uploadedAt ?? new Date(),
          metadata: attachment.metadata ?? undefined,
          dataClassification: attachment.dataClassification,
          residencyTag: attachment.residencyTag,
        })),
      });

      const refreshed = await this.ensureAbsence(tx, context, id);
      return mapPrismaUnplannedAbsenceToDomain(refreshed);
    });
  }

  async removeAttachment(contextOrOrgId: RepositoryAuthorizationContext | string, id: string, attachmentId: string): Promise<UnplannedAbsence> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    return this.prisma.$transaction(async (tx) => {
      await this.ensureAbsence(tx, context, id);
      const existing = await tx.absenceAttachment.findFirst({
        where: { id: attachmentId, absenceId: id, orgId: context.orgId },
      });
      if (!existing) {
        throw new EntityNotFoundError('Absence attachment', { attachmentId });
      }
      await tx.absenceAttachment.deleteMany({
        where: { id: attachmentId, orgId: context.orgId },
      });
      const refreshed = await this.ensureAbsence(tx, context, id);
      return mapPrismaUnplannedAbsenceToDomain(refreshed);
    });
  }

  async deleteAbsence(contextOrOrgId: RepositoryAuthorizationContext | string, id: string, audit: AbsenceDeletionAuditEntry): Promise<void> {
    const context = this.normalizeAuthorizationContext(contextOrOrgId, 'unplanned_absence');
    await this.prisma.$transaction(async (tx) => {
      await this.ensureAbsence(tx, context, id);
      await tx.absenceDeletionAudit.upsert({
        where: { absenceId: id },
        create: {
          orgId: context.orgId,
          absenceId: id,
          reason: audit.reason,
          deletedByUserId: audit.deletedByUserId,
          deletedAt: audit.deletedAt,
          metadata: audit.metadata ?? undefined,
          dataClassification: audit.dataClassification,
          residencyTag: audit.residencyTag,
        },
        update: {
          reason: audit.reason,
          deletedByUserId: audit.deletedByUserId,
          deletedAt: audit.deletedAt,
          metadata: audit.metadata ?? undefined,
          dataClassification: audit.dataClassification,
          residencyTag: audit.residencyTag,
        },
      });

      await tx.unplannedAbsence.updateMany({
        where: { id, orgId: context.orgId },
        data: {
          status: 'CANCELLED',
          deletionReason: audit.reason,
          deletedAt: audit.deletedAt,
          deletedByUserId: audit.deletedByUserId,
        },
      });
    });
  }

  private async ensureAbsence(
    client: Prisma.TransactionClient | PrismaClient,
    context: RepositoryAuthorizationContext,
    id: string,
  ): Promise<AbsenceRecordWithRelations> {
    const record = await client.unplannedAbsence.findFirst({
      where: { id, orgId: context.orgId },
      include: ABSENCE_RELATIONS,
    });
    if (!record) {
      throw new EntityNotFoundError('Absence', { absenceId: id });
    }
    this.assertTenantRecord(record, context, 'unplanned_absence');
    return record;
  }
}
