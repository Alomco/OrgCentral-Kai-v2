import { Prisma, type PrismaClient, type ChecklistInstance as PrismaChecklistInstance } from '../../../../../generated/client';
import { z } from 'zod'; // Import z explicitly for array usage
import { checklistInstanceItemSchema } from '@/server/validators/hr/onboarding/checklist-validators';
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

        // Validate items and metadata
        const validatedItems = z.array(checklistInstanceItemSchema).parse(mapped.items);
        // mapped.metadata is already Record<string, unknown> | undefined, but let's be safe if we want strictness.
        // Actually mapChecklistInstanceInputToRecord returns domain objects.
        // We can just trust strict types or validate if we suspect the mapper lets loose types through.
        // For items (JSON), validation is crucial.

        const data: ChecklistInstanceCreateData = {
            orgId: input.orgId,
            employeeId: input.employeeId,
            templateId: input.templateId,
            templateName: mapped.templateName ?? null,
            items: toRequiredJsonNullInput(validatedItems as unknown as Prisma.InputJsonValue),
            metadata: toRequiredJsonNullInput(mapped.metadata as unknown as Prisma.InputJsonValue),
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

        // Validate items if present
        let itemsJson: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined = undefined;
        if (mapped.items !== undefined) {
            const validatedItems = z.array(checklistInstanceItemSchema).parse(mapped.items);
            itemsJson = toJsonNullInput(validatedItems as unknown as Prisma.InputJsonValue);
        }

        const data: ChecklistInstanceUpdateData = stampUpdate({
            ...mapped,
            items: itemsJson,
            metadata:
                mapped.metadata !== undefined
                    ? toJsonNullInput(mapped.metadata as unknown as Prisma.InputJsonValue)
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

    async findPendingChecklists(
        orgId: string,
    ): Promise<ChecklistInstance[]> {
        const records = await this.checklistInstances.findMany({
            where: {
                orgId,
                status: 'IN_PROGRESS',
            },
        });
        return records.map(mapChecklistInstanceRecordToDomain);
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

function toJsonNullInput(
    value: Parameters<typeof toPrismaInputJson>[0],
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    const resolved = toPrismaInputJson(value);
    if (resolved === Prisma.DbNull) {
        return Prisma.JsonNull;
    }
    return resolved as Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
}

function toRequiredJsonNullInput(
    value: Parameters<typeof toPrismaInputJson>[0],
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return toJsonNullInput(value) ?? Prisma.JsonNull;
}
