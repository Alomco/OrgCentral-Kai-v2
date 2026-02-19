import type {
    Prisma,
    LeavePolicyType as PrismaLeavePolicyType,
    LeaveAccrualFrequency as PrismaLeaveAccrualFrequency,
    DataClassificationLevel,
    DataResidencyZone,
} from '../../../../../generated/client';

export interface LeavePolicyFilters {
    orgId?: string;
    departmentId?: string;
    policyType?: PrismaLeavePolicyType;
    active?: boolean;
    isDefault?: boolean;
}

export interface LeavePolicyCreationData {
    orgId: string;
    departmentId?: string;
    name: string;
    policyType: PrismaLeavePolicyType;
    accrualFrequency?: PrismaLeaveAccrualFrequency;
    accrualAmount?: number | null;
    carryOverLimit?: number;
    requiresApproval?: boolean;
    isDefault?: boolean;
    activeFrom: Date;
    activeTo?: Date;
    statutoryCompliance?: boolean;
    maxConsecutiveDays?: number | null;
    allowNegativeBalance?: boolean;
    dataClassification?: DataClassificationLevel;
    residencyTag?: DataResidencyZone;
    auditSource?: string | null;
    auditBatchId?: string | null;
    metadata?: Prisma.InputJsonValue | Record<string, unknown> | null;
}

export interface LeavePolicyUpdateData {
    name?: string;
    policyType?: PrismaLeavePolicyType;
    departmentId?: string | null;
    accrualFrequency?: PrismaLeaveAccrualFrequency;
    accrualAmount?: number | null;
    carryOverLimit?: number | null;
    requiresApproval?: boolean;
    isDefault?: boolean;
    activeFrom?: Date;
    activeTo?: Date | null;
    statutoryCompliance?: boolean;
    maxConsecutiveDays?: number | null;
    allowNegativeBalance?: boolean;
    dataClassification?: DataClassificationLevel;
    residencyTag?: DataResidencyZone;
    auditSource?: string | null;
    auditBatchId?: string | null;
    metadata?: Prisma.InputJsonValue | Record<string, unknown> | null;
}
