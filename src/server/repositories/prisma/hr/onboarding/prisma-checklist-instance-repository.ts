import { Prisma, type PrismaClient, type ChecklistInstance as PrismaChecklistInstance } from '@prisma/client';
import type {
    ChecklistInstanceCreateInput,
    ChecklistInstanceItemsUpdate,
    IChecklistInstanceRepository,
} from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { ChecklistInstance } from '@/server/types/onboarding-types';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import {
    mapChecklistInstanceInputToRecord,
    mapChecklistInstanceRecordToDomain,
} from '@/server/repositories/mappers/hr/onboarding/checklist-instance-mapper';
import { stampUpdate } from '@/server/repositories/prisma/helpers/timestamps';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { registerOrgCacheTag, invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_INSTANCES } from '@/server/repositories/cache-scopes';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

type ChecklistInstanceRecord = PrismaChecklistInstance;
type ChecklistInstanceCreateData = Prisma.ChecklistInstanceUncheckedCreateInput;
type ChecklistInstanceUpdateData = Prisma.ChecklistInstanceUncheckedUpdateInput;
export class PrismaChecklistInstanceRepository
    extends BasePrismaRepository
    implements IChecklistInstanceRepository {
    private static readonly DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
    private static readonly DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';
    private get checklistInstances(): PrismaClient['checklistInstance'] {
        return this.prisma.checklistInstance;
    }

    private async ensureInstanceOrg(instanceId: string, orgId: string): Promise<ChecklistInstanceRecord> {
        const record = await this.checklistInstances.findUnique({ where: { id: instanceId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Checklist instance not found for this organization.');
        }
        return record;
    }

    async createInstance(input: ChecklistInstanceCreateInput): Promise<ChecklistInstance> {
        const mapped = mapChecklistInstanceInputToRecord(input);
        const data: ChecklistInstanceCreateData = {
            orgId: input.orgId,
            employeeId: input.employeeId,
            templateId: input.templateId,
            templateName: mapped.templateName ?? null,
            items: toPrismaInputJson(mapped.items as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined) ?? Prisma.JsonNull,
            metadata: toPrismaInputJson(mapped.metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined) ?? Prisma.JsonNull,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            updatedAt: new Date(),
        };
        const record = await this.checklistInstances.create({
            data,
        });
        registerOrgCacheTag(
            input.orgId,
            CACHE_SCOPE_CHECKLIST_INSTANCES,
            PrismaChecklistInstanceRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistInstanceRepository.DEFAULT_RESIDENCY,
        );
        return mapChecklistInstanceRecordToDomain(record);
    }

    async getInstance(orgId: string, instanceId: string): Promise<ChecklistInstance | null> {
        const record = await this.checklistInstances.findUnique({ where: { id: instanceId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Checklist instance access denied for this organization.');
        }
        return mapChecklistInstanceRecordToDomain(record);
    }

    async getActiveInstanceForEmployee(orgId: string, employeeId: string): Promise<ChecklistInstance | null> {
        const record = await this.checklistInstances.findFirst({
            where: { orgId, employeeId, status: 'IN_PROGRESS' },
        });
        return record ? mapChecklistInstanceRecordToDomain(record) : null;
    }

    async listInstancesForEmployee(orgId: string, employeeId: string): Promise<ChecklistInstance[]> {
        const records = await this.checklistInstances.findMany({ where: { orgId, employeeId } });
        return records.map(mapChecklistInstanceRecordToDomain);
    }

    async updateItems(
        orgId: string,
        instanceId: string,
        updates: ChecklistInstanceItemsUpdate,
    ): Promise<ChecklistInstance> {
        await this.ensureInstanceOrg(instanceId, orgId);
        const mapped = mapChecklistInstanceInputToRecord(updates);
        const data: ChecklistInstanceUpdateData = stampUpdate({
            ...mapped,
            items:
                mapped.items !== undefined
                    ? toPrismaInputJson(mapped.items as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined) ?? Prisma.JsonNull
                    : undefined,
            metadata:
                mapped.metadata !== undefined
                    ? toPrismaInputJson(mapped.metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined) ?? Prisma.JsonNull
                    : undefined,
            orgId,
        });
        const record = await this.checklistInstances.update({
            where: { id: instanceId },
            data,
        });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_CHECKLIST_INSTANCES,
            PrismaChecklistInstanceRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistInstanceRepository.DEFAULT_RESIDENCY,
        );
        return mapChecklistInstanceRecordToDomain(record);
    }

    async completeInstance(orgId: string, instanceId: string): Promise<ChecklistInstance> {
        await this.ensureInstanceOrg(instanceId, orgId);
        const record = await this.checklistInstances.update({
            where: { id: instanceId },
            data: stampUpdate({ status: 'COMPLETED', completedAt: new Date(), orgId }),
        });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_CHECKLIST_INSTANCES,
            PrismaChecklistInstanceRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistInstanceRepository.DEFAULT_RESIDENCY,
        );
        return mapChecklistInstanceRecordToDomain(record);
    }

    async cancelInstance(orgId: string, instanceId: string): Promise<void> {
        await this.ensureInstanceOrg(instanceId, orgId);
        await this.checklistInstances.update({
            where: { id: instanceId },
            data: stampUpdate({ status: 'CANCELLED', orgId }),
        });
        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_CHECKLIST_INSTANCES,
            PrismaChecklistInstanceRepository.DEFAULT_CLASSIFICATION,
            PrismaChecklistInstanceRepository.DEFAULT_RESIDENCY,
        );
    }
}
