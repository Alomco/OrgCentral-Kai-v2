import { Prisma, type PrismaClient, type Offboarding as PrismaOffboarding } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IOffboardingRepository, OffboardingListFilters } from '@/server/repositories/contracts/hr/offboarding';
import type { OffboardingCreateInput, OffboardingUpdateInput, OffboardingRecord } from '@/server/types/hr/offboarding-types';
import { mapOffboardingRecordToDomain } from '@/server/repositories/mappers/hr/offboarding';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';

export class PrismaOffboardingRepository extends BasePrismaRepository implements IOffboardingRepository {
    private get offboarding(): PrismaClient['offboarding'] {
        return this.prisma.offboarding;
    }

    private async ensureOrg(offboardingId: string, orgId: string): Promise<PrismaOffboarding> {
        const record = await this.offboarding.findUnique({ where: { id: offboardingId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Offboarding record not found for this organization.');
        }
        return record;
    }

    async createOffboarding(input: OffboardingCreateInput): Promise<OffboardingRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.offboarding.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                initiatedByUserId: input.initiatedByUserId,
                checklistInstanceId: input.checklistInstanceId ?? null,
                reason: input.reason,
                status: 'IN_PROGRESS',
                startedAt: new Date(),
                completedAt: null,
                canceledAt: null,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.dataResidency,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapOffboardingRecordToDomain(record);
    }

    async updateOffboarding(
        orgId: string,
        offboardingId: string,
        updates: OffboardingUpdateInput,
    ): Promise<OffboardingRecord> {
        await this.ensureOrg(offboardingId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.offboarding.update({
            where: { id: offboardingId },
            data: {
                status: updates.status,
                completedAt: updates.completedAt ?? undefined,
                canceledAt: updates.canceledAt ?? undefined,
                checklistInstanceId: updates.checklistInstanceId ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapOffboardingRecordToDomain(record);
    }

    async getOffboarding(orgId: string, offboardingId: string): Promise<OffboardingRecord | null> {
        const record = await this.offboarding.findUnique({ where: { id: offboardingId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Offboarding record access denied for this organization.');
        }
        return mapOffboardingRecordToDomain(record);
    }

    async getOffboardingByEmployee(orgId: string, employeeId: string): Promise<OffboardingRecord | null> {
        const record = await this.offboarding.findFirst({
            where: { orgId, employeeId, status: 'IN_PROGRESS' },
            orderBy: { startedAt: 'desc' },
        });
        return record ? mapOffboardingRecordToDomain(record) : null;
    }

    async listOffboarding(orgId: string, filters?: OffboardingListFilters): Promise<OffboardingRecord[]> {
        const recordList = await this.offboarding.findMany({
            where: {
                orgId,
                status: filters?.status,
                employeeId: filters?.employeeId,
            },
            orderBy: { startedAt: 'desc' },
        });
        return recordList.map(mapOffboardingRecordToDomain);
    }
}
