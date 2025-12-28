
import type { LeaveBalance, LeaveRequest } from '@/server/types/leave-types';
import { calculateTotalDaysFromHours } from '@/server/domain/leave/leave-calculator';
import type { Prisma, LeaveBalance as PrismaLeaveBalance, LeaveRequest as PrismaLeaveRequest } from '@prisma/client';

type JsonLike = Prisma.JsonValue | null | undefined;

const isJsonObject = (value: JsonLike): value is Prisma.JsonObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneJsonObject = (value: JsonLike): Prisma.JsonObject => (
    isJsonObject(value) ? { ...value } : {}
);

const cloneLeaveRequestMetadata = (value: JsonLike): LeaveRequestMetadata => (
    cloneJsonObject(value) as LeaveRequestMetadata
);

const cloneLeaveBalanceMetadata = (value: JsonLike): LeaveBalanceMetadata => (
    cloneJsonObject(value) as LeaveBalanceMetadata
);

export type LeaveRequestMetadata = Prisma.JsonObject & {
    employeeId?: string;
    employeeName?: string;
    leaveType?: string;
    coveringEmployee?: string | null;
    totalDays?: number;
    isHalfDay?: boolean;
    managerComments?: string | null;
};

export type LeaveBalanceMetadata = Prisma.JsonObject & {
    employeeId?: string;
    leaveType?: string;
    year?: number;
    totalEntitlement?: number;
    used?: number;
    pending?: number;
    available?: number;
    // Compliance fields per DSPT requirements
    informationClass?: string;
    residencyRegion?: string;
    createdBy?: string;
    updatedBy?: string;
};

export const normalizeLeaveBalanceMetadata = (value: Prisma.JsonValue | null): LeaveBalanceMetadata =>
    cloneLeaveBalanceMetadata(value);

const STATUS_FROM_DOMAIN: Record<LeaveRequest['status'], PrismaLeaveRequest['status']> = {
    submitted: 'SUBMITTED',
    approved: 'APPROVED',
    rejected: 'REJECTED',
    cancelled: 'CANCELLED',
};

const STATUS_TO_DOMAIN: Record<PrismaLeaveRequest['status'], LeaveRequest['status']> = {
    DRAFT: 'submitted',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    PENDING_APPROVAL: 'submitted',
    AWAITING_MANAGER: 'submitted',
};

interface LeaveMapperConfig {
    hoursPerDay?: number;
}

export function mapPrismaLeaveRequestToDomain(
    record: PrismaLeaveRequest,
    config?: LeaveMapperConfig,
): LeaveRequest {
    const metadata = cloneLeaveRequestMetadata(record.metadata);

    return {
        id: record.id,
        orgId: record.orgId,
        dataResidency: record.residencyTag,
        dataClassification: record.dataClassification,
        auditSource: record.auditSource ?? 'leave-request',
        auditBatchId: record.auditBatchId ?? undefined,
        employeeId: metadata.employeeId ?? record.userId,
        userId: record.userId,
        employeeName: metadata.employeeName ?? '',
        leaveType: metadata.leaveType ?? record.policyId,
        startDate: record.startDate.toISOString(),
        endDate: record.endDate.toISOString(),
        reason: record.reason ?? undefined,
        totalDays: metadata.totalDays ?? calculateTotalDaysFromHours(Number(record.hours), { hoursPerDay: config?.hoursPerDay }),
        isHalfDay: metadata.isHalfDay ?? false,
        coveringEmployeeId: metadata.coveringEmployee ?? undefined,
        coveringEmployeeName: metadata.coveringEmployee ?? undefined,
        status: STATUS_TO_DOMAIN[record.status],
        createdAt: record.createdAt.toISOString(),
        createdBy: record.userId,
        submittedAt: record.submittedAt?.toISOString(),
        approvedBy: record.approverUserId ?? undefined,
        approvedAt: record.decidedAt?.toISOString(),
        rejectedBy: record.approverUserId ?? undefined,
        rejectedAt: record.decidedAt?.toISOString(),
        rejectionReason: record.reason ?? undefined,
        cancelledBy: undefined,
        cancelledAt: undefined,
        cancellationReason: undefined,
        managerComments: metadata.managerComments ?? undefined,
    };
}

export function mapPrismaLeaveBalanceToDomain(record: PrismaLeaveBalance): LeaveBalance {
    const metadata = cloneLeaveBalanceMetadata(record.metadata);

    return {
        id: record.id,
        orgId: record.orgId,
        dataResidency: record.residencyTag,
        dataClassification: record.dataClassification,
        auditSource: record.auditSource ?? 'leave-balance',
        auditBatchId: record.auditBatchId ?? undefined,
        employeeId: metadata.employeeId ?? record.userId,
        leaveType: metadata.leaveType ?? record.policyId,
        year: metadata.year ?? record.periodStart.getUTCFullYear(),
        totalEntitlement: metadata.totalEntitlement ?? Number(record.accruedHours),
        used: metadata.used ?? Number(record.usedHours),
        pending: metadata.pending ?? Number(record.carriedHours),
        available: metadata.available ?? metadata.totalEntitlement ?? Number(record.accruedHours),
        createdAt: record.periodStart.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

export function buildLeaveRequestMetadata(input: {
    employeeId: string;
    employeeName: string;
    coveringEmployee?: string;
    totalDays: number;
    isHalfDay: boolean;
    managerComments?: string;
    leaveType: string;
}): LeaveRequestMetadata & { leaveType: string } {
    return {
        leaveType: input.leaveType,
        employeeId: input.employeeId,
        employeeName: input.employeeName,
        coveringEmployee: input.coveringEmployee,
        totalDays: input.totalDays,
        isHalfDay: input.isHalfDay,
        managerComments: input.managerComments,
    } satisfies LeaveRequestMetadata & { leaveType: string };
}

export function buildLeaveBalanceMetadata(
    input: Omit<LeaveBalance, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>,
    auditContext?: { createdBy?: string; informationClass?: string; residencyRegion?: string }
): LeaveBalanceMetadata {
    return {
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        year: input.year,
        totalEntitlement: input.totalEntitlement,
        used: input.used,
        pending: input.pending,
        available: input.available,
        // Compliance metadata (from audit context or defaults)
        informationClass: auditContext?.informationClass ?? input.dataClassification,
        residencyRegion: auditContext?.residencyRegion ?? input.dataResidency,
        createdBy: auditContext?.createdBy,
    } satisfies LeaveBalanceMetadata;
}

export function mapDomainStatusToPrisma(status: LeaveRequest['status']): PrismaLeaveRequest['status'] {
    return STATUS_FROM_DOMAIN[status];
}
