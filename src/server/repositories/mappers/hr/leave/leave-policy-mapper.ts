import type { LeavePolicy as DomainLeavePolicy, LeaveAccrualFrequency, LeavePolicyType } from '@/server/types/leave-types';
import type { LeavePolicyCreationData, LeavePolicyUpdateData } from '@/server/repositories/prisma/hr/leave/prisma-leave-policy-repository.types';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { Prisma as PrismaValue, type PrismaDecimal, type PrismaInputJsonValue } from '@/server/types/prisma';
import type { Prisma } from '@prisma/client';
import { toNumber } from '@/server/domain/absences/conversions';

interface LeavePolicyRecord {
    id: string;
    orgId: string;
    dataClassification: DataClassificationLevel;
    residencyTag: DataResidencyZone;
    auditSource?: string | null;
    auditBatchId?: string | null;
    name: string;
    policyType: LeavePolicyType;
    accrualFrequency: LeaveAccrualFrequency;
    accrualAmount?: PrismaDecimal | null;
    carryOverLimit?: number | null;
    requiresApproval: boolean;
    isDefault: boolean;
    activeFrom: Date;
    activeTo?: Date | null;
    statutoryCompliance?: boolean | null;
    maxConsecutiveDays?: number | null;
    allowNegativeBalance?: boolean | null;
    metadata?: PrismaInputJsonValue | null;
}

type LeavePolicyCreatePayload = Prisma.LeavePolicyUncheckedCreateInput;
type LeavePolicyUpdatePayload = Prisma.LeavePolicyUncheckedUpdateInput;

export function mapCreateToPrisma(input: LeavePolicyCreationData): LeavePolicyCreatePayload {
    const {
        orgId,
        departmentId,
        name,
        policyType,
        accrualFrequency,
        accrualAmount,
        carryOverLimit,
        requiresApproval,
        isDefault,
        activeFrom,
        activeTo,
        statutoryCompliance,
        maxConsecutiveDays,
        allowNegativeBalance,
        dataClassification,
        residencyTag,
        auditSource,
        auditBatchId,
        metadata,
    } = input;

    return {
        orgId,
        departmentId: departmentId ?? undefined,
        name,
        policyType,
        accrualFrequency: accrualFrequency ?? undefined,
        accrualAmount: accrualAmount ?? null,
        carryOverLimit: carryOverLimit ?? null,
        requiresApproval: requiresApproval ?? true,
        isDefault: isDefault ?? false,
        activeFrom: activeFrom instanceof Date ? activeFrom : new Date(activeFrom),
        activeTo: activeTo ? (activeTo instanceof Date ? activeTo : new Date(activeTo)) : null,
        statutoryCompliance: statutoryCompliance ?? false,
        maxConsecutiveDays: maxConsecutiveDays ?? null,
        allowNegativeBalance: allowNegativeBalance ?? false,
        dataClassification: dataClassification ?? undefined,
        residencyTag: residencyTag ?? undefined,
        auditSource: auditSource ?? null,
        auditBatchId: auditBatchId ?? null,
        metadata: toJsonNullInput(metadata),
    } satisfies LeavePolicyCreatePayload;
}

export function buildPrismaLeavePolicyUpdate(updates: Partial<LeavePolicyUpdateData>): LeavePolicyUpdatePayload {
    const prismaUpdate: LeavePolicyUpdatePayload = {};

    if (updates.name !== undefined) {
        prismaUpdate.name = updates.name;
    }
    if (updates.policyType !== undefined) {
        prismaUpdate.policyType = updates.policyType;
    }
    if ('departmentId' in updates) {
        prismaUpdate.departmentId = updates.departmentId ?? null;
    }
    if (updates.accrualFrequency !== undefined) {
        prismaUpdate.accrualFrequency = updates.accrualFrequency;
    }
    if ('accrualAmount' in updates) {
        prismaUpdate.accrualAmount = updates.accrualAmount ?? null;
    }
    if ('carryOverLimit' in updates) {
        prismaUpdate.carryOverLimit = updates.carryOverLimit ?? null;
    }
    if (updates.requiresApproval !== undefined) {
        prismaUpdate.requiresApproval = updates.requiresApproval;
    }
    if (updates.isDefault !== undefined) {
        prismaUpdate.isDefault = updates.isDefault;
    }
    if (updates.activeFrom !== undefined) {
        prismaUpdate.activeFrom = updates.activeFrom;
    }
    if ('activeTo' in updates) {
        prismaUpdate.activeTo = updates.activeTo ?? null;
    }
    if (updates.statutoryCompliance !== undefined) {
        prismaUpdate.statutoryCompliance = updates.statutoryCompliance;
    }
    if ('maxConsecutiveDays' in updates) {
        prismaUpdate.maxConsecutiveDays = updates.maxConsecutiveDays ?? null;
    }
    if (updates.allowNegativeBalance !== undefined) {
        prismaUpdate.allowNegativeBalance = updates.allowNegativeBalance;
    }
    if (updates.dataClassification !== undefined) {
        prismaUpdate.dataClassification = updates.dataClassification;
    }
    if (updates.residencyTag !== undefined) {
        prismaUpdate.residencyTag = updates.residencyTag;
    }
    if ('auditSource' in updates) {
        prismaUpdate.auditSource = updates.auditSource ?? null;
    }
    if ('auditBatchId' in updates) {
        prismaUpdate.auditBatchId = updates.auditBatchId ?? null;
    }
    if ('metadata' in updates) {
        prismaUpdate.metadata = toJsonNullInput(updates.metadata);
    }

    return prismaUpdate;
}

function toJsonNullInput(
    value: PrismaInputJsonValue | Record<string, unknown> | null | undefined,
): PrismaInputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === null) {
        return PrismaValue.JsonNull;
    }
    if (value === undefined) {
        return undefined;
    }
    return value as PrismaInputJsonValue;
}

export function mapPrismaToDomain(record: LeavePolicyRecord): DomainLeavePolicy {
    const accrualAmount =
        record.accrualAmount === null || record.accrualAmount === undefined
            ? null
            : toNumber(record.accrualAmount);

    return {
        id: record.id,
        orgId: record.orgId,
        dataResidency: record.residencyTag,
        dataClassification: record.dataClassification,
        auditSource: record.auditSource ?? 'leave-policy',
        auditBatchId: record.auditBatchId ?? undefined,
        name: record.name,
        policyType: record.policyType,
        accrualFrequency: record.accrualFrequency,
        accrualAmount,
        carryOverLimit: record.carryOverLimit ?? undefined,
        requiresApproval: record.requiresApproval,
        isDefault: record.isDefault,
        activeFrom: record.activeFrom.toISOString(),
        activeTo: record.activeTo?.toISOString(),
        statutoryCompliance: record.statutoryCompliance ?? undefined,
        maxConsecutiveDays: record.maxConsecutiveDays ?? undefined,
        allowNegativeBalance: record.allowNegativeBalance ?? undefined,
        metadata: toMetadataRecord(record.metadata),
        createdAt: record.activeFrom.toISOString(),
        updatedAt: record.activeTo ? record.activeTo.toISOString() : record.activeFrom.toISOString(),
    };
}

const exported = {
    mapCreateToPrisma,
    buildPrismaLeavePolicyUpdate,
    mapPrismaToDomain,
};
export default exported;

function toMetadataRecord(
    value: PrismaInputJsonValue | null | undefined,
): Record<string, unknown> | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
}
