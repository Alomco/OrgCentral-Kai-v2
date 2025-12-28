import type { Prisma, PrismaClient, ComplianceLogItem as PrismaComplianceLogItem } from '@prisma/client';
import type {
    ComplianceAssignmentInput,
    ComplianceItemUpdateInput,
    IComplianceItemRepository,
} from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceStatusRepository } from '@/server/repositories/contracts/hr/compliance/compliance-status-repository-contract';
import { PrismaComplianceStatusRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-status-repository';
import type { ComplianceLogItem } from '@/server/types/compliance-types';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import {
    mapComplianceAssignmentInputToRecord,
    mapComplianceItemUpdateToRecord,
    mapComplianceLogRecordToDomain,
    type ComplianceLogItemRecord,
} from '@/server/repositories/mappers/hr/compliance/compliance-item-mapper';
import { stampCreate, stampUpdate } from '@/server/repositories/prisma/helpers/timestamps';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_COMPLIANCE_ITEMS } from '@/server/repositories/cache-scopes';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

type ComplianceLogRecord = PrismaComplianceLogItem;
type ComplianceLogCreateData = Prisma.ComplianceLogItemUncheckedCreateInput;
type ComplianceLogUpdateData = Prisma.ComplianceLogItemUncheckedUpdateInput;
type ComplianceLogFindManyArguments = Prisma.ComplianceLogItemFindManyArgs;

export class PrismaComplianceItemRepository
    extends BasePrismaRepository
    implements IComplianceItemRepository {
    private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
    private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
    private readonly statusRepository: IComplianceStatusRepository;

    constructor(
        options: BasePrismaRepositoryOptions & { complianceStatusRepository?: IComplianceStatusRepository } = {},
    ) {
        super(options);
        this.statusRepository =
            options.complianceStatusRepository ?? new PrismaComplianceStatusRepository({ prisma: this.prisma });
    }

    private get complianceLog(): PrismaClient['complianceLogItem'] {
        return this.prisma.complianceLogItem;
    }

    private async ensureItemScope(itemId: string, orgId: string, userId: string): Promise<ComplianceLogRecord> {
        const record = await this.complianceLog.findUnique({ where: { id: itemId } });
        const { orgId: recordOrgId, userId: recordUserId } = (record ?? {}) as { orgId?: string; userId?: string };
        if (!record || recordOrgId !== orgId || recordUserId !== userId) {
            throw new RepositoryAuthorizationError('Compliance item not found for this user/organization.');
        }
        return record;
    }

    async assignItems(input: ComplianceAssignmentInput): Promise<void> {
        const records = mapComplianceAssignmentInputToRecord(input);
        await Promise.all(
            records.map((data) =>
                this.complianceLog.create({
                    data: stampCreate({
                        ...data,
                        attachments: toPrismaInputJson(data.attachments ?? null),
                        metadata: toPrismaInputJson(data.metadata ?? null),
                    }) as ComplianceLogCreateData,
                }),
            ),
        );
        registerOrgCacheTag(
            input.orgId,
            CACHE_SCOPE_COMPLIANCE_ITEMS,
            PrismaComplianceItemRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceItemRepository.DEFAULT_RESIDENCY,
        );
        await this.statusRepository.recalculateForUser(input.orgId, input.userId);
    }

    async getItem(orgId: string, userId: string, itemId: string): Promise<ComplianceLogItem | null> {
        const record = await this.complianceLog.findUnique({ where: { id: itemId } });
        if (!record) { return null; }
        const { orgId: recordOrgId, userId: recordUserId } = record as { orgId?: string; userId?: string };
        if (recordOrgId !== orgId || recordUserId !== userId) {
            throw new RepositoryAuthorizationError('Compliance item access denied for this user/organization.');
        }
        return mapComplianceLogRecordToDomain(record as unknown as ComplianceLogItemRecord);
    }

    async listItemsForUser(orgId: string, userId: string): Promise<ComplianceLogItem[]> {
        const records = await this.complianceLog.findMany({ where: { orgId, userId } });
        return records.map((r) => mapComplianceLogRecordToDomain(r as unknown as ComplianceLogItemRecord));
    }

    async listPendingReviewItemsForOrg(orgId: string, take = 100): Promise<ComplianceLogItem[]> {
        const safeTake = Number.isFinite(take) ? Math.max(1, Math.min(500, take)) : 100;
        const records = await this.complianceLog.findMany({
            where: { orgId, status: 'PENDING_REVIEW' },
            orderBy: { updatedAt: 'desc' },
            take: safeTake,
        });
        return records.map((r) => mapComplianceLogRecordToDomain(r as unknown as ComplianceLogItemRecord));
    }

    async updateItem(
        orgId: string,
        userId: string,
        itemId: string,
        updates: ComplianceItemUpdateInput,
    ): Promise<ComplianceLogItem> {
        await this.ensureItemScope(itemId, orgId, userId);
        const mapped = mapComplianceItemUpdateToRecord(updates);
        const data: ComplianceLogUpdateData = stampUpdate({
            ...mapped,
            attachments: toPrismaInputJson(mapped.attachments ?? null),
            metadata: toPrismaInputJson(mapped.metadata ?? null),
            orgId,
            userId,
        });
        const record = await this.complianceLog.update({
            where: { id: itemId },
            data,
        });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_COMPLIANCE_ITEMS,
            PrismaComplianceItemRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceItemRepository.DEFAULT_RESIDENCY,
        );
        await this.statusRepository.recalculateForUser(orgId, userId);
        return mapComplianceLogRecordToDomain(record as unknown as ComplianceLogItemRecord);
    }

    async deleteItem(orgId: string, userId: string, itemId: string): Promise<void> {
        await this.ensureItemScope(itemId, orgId, userId);
        await this.complianceLog.delete({ where: { id: itemId } });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_COMPLIANCE_ITEMS,
            PrismaComplianceItemRepository.DEFAULT_CLASSIFICATION,
            PrismaComplianceItemRepository.DEFAULT_RESIDENCY,
        );
        await this.statusRepository.recalculateForUser(orgId, userId);
    }

    async findExpiringItemsForOrg(
        orgId: string,
        referenceDate: Date,
        daysUntilExpiry: number,
    ): Promise<ComplianceLogItem[]> {
        const cutoff = new Date(referenceDate);
        cutoff.setDate(cutoff.getDate() + daysUntilExpiry);
        const where: ComplianceLogFindManyArguments['where'] = {
            orgId,
            dueDate: { lte: cutoff },
            status: { in: ['PENDING', 'PENDING_REVIEW'] },
        };
        const records = await this.complianceLog.findMany({ where });
        return records.map((r) => mapComplianceLogRecordToDomain(r as unknown as ComplianceLogItemRecord));
    }
}
