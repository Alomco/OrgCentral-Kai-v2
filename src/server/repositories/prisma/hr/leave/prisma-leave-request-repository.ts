import { Prisma } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { ILeaveRequestRepository, LeaveRequestCreateInput, LeaveRequestReadOptions } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { TenantScope } from '@/server/types/tenant';
import type { LeaveRequest } from '@/server/types/leave-types';
import {
    buildLeaveRequestMetadata,
    mapDomainStatusToPrisma,
    mapPrismaLeaveRequestToDomain,
} from '@/server/repositories/mappers/hr/leave/leave-mapper';
import { DEFAULT_WORKING_HOURS_PER_DAY } from '@/server/domain/leave/leave-calculator';
import { EntityNotFoundError } from '@/server/errors';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_LEAVE_REQUESTS } from '@/server/repositories/cache-scopes';
import { isJsonObject } from '@/server/repositories/prisma/helpers/prisma-utils';

export class PrismaLeaveRequestRepository extends BasePrismaRepository implements ILeaveRequestRepository {

    async createLeaveRequest(tenant: TenantScope, request: LeaveRequestCreateInput): Promise<void> {
        const { orgId } = tenant;
        const hoursPerDay = request.hoursPerDay ?? DEFAULT_WORKING_HOURS_PER_DAY;
        const metadata = buildLeaveRequestMetadata({
            employeeId: request.employeeId,
            employeeName: request.employeeName,
            // prefer human name for the covering employee where available
            coveringEmployee: request.coveringEmployeeName ?? undefined,
            totalDays: request.totalDays,
            isHalfDay: request.isHalfDay,
            // ensure we don't pass explicit `null` to a string union
            managerComments: request.managerComments ?? undefined,
            leaveType: request.leaveType,
        });

        await this.prisma.leaveRequest.create({
            data: {
                id: request.id,
                orgId,
                userId: request.userId,
                policyId: request.policyId,
                status: mapDomainStatusToPrisma('submitted'),
                startDate: new Date(request.startDate),
                endDate: new Date(request.endDate),
                hours: new Prisma.Decimal(request.totalDays * hoursPerDay),
                reason: request.reason ?? null,
                dataClassification: request.dataClassification,
                residencyTag: request.dataResidency,
                auditSource: request.auditSource,
                auditBatchId: request.auditBatchId ?? tenant.auditBatchId,
                metadata,
                submittedAt: new Date(),
            },
        });

        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_LEAVE_REQUESTS,
            request.dataClassification,
            request.dataResidency,
        );
    }

    async updateLeaveRequest(
        tenant: TenantScope,
        requestId: string,
        updates: Partial<Pick<LeaveRequest,
            'status' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt' |
            'rejectionReason' | 'cancelledBy' | 'cancelledAt' | 'cancellationReason' |
            'managerComments'>>,
    ): Promise<void> {
        const { orgId } = tenant;
        const existing = await this.prisma.leaveRequest.findUnique({ where: { id: requestId } });
        if (existing?.orgId !== orgId) {
            throw new EntityNotFoundError('Leave request', { requestId, orgId });
        }

        const metadata: Prisma.JsonObject = isJsonObject(existing.metadata) ? { ...existing.metadata } : {};

        if ('managerComments' in updates) {
            // managerComments can be null value, keep it as-is when intentionally set
            metadata.managerComments = updates.managerComments ?? undefined;
        }
        if (updates.cancellationReason !== undefined) {
            metadata.cancellationReason = updates.cancellationReason;
        }
        if (updates.cancelledBy !== undefined) {
            metadata.cancelledBy = updates.cancelledBy;
        }
        if (updates.cancelledAt !== undefined) {
            // updates.cancelledAt is a string (TimestampString) per contract; store as-is
            metadata.cancelledAt = updates.cancelledAt;
        }

        await this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: updates.status ? mapDomainStatusToPrisma(updates.status) : undefined,
                approverOrgId:
                    updates.approvedBy || updates.rejectedBy ? orgId : existing.approverOrgId,
                approverUserId: updates.approvedBy ?? updates.rejectedBy ?? existing.approverUserId,
                // Prisma expects Date instances for date-time fields; convert from string timestamps if provided
                decidedAt: updates.approvedAt ? new Date(updates.approvedAt) : updates.rejectedAt ? new Date(updates.rejectedAt) : existing.decidedAt,
                reason: updates.rejectionReason ?? existing.reason,
                // Cast metadata to Prisma's expected JSON type
                metadata,
            },
        });

        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_LEAVE_REQUESTS,
            existing.dataClassification,
            existing.residencyTag,
        );
    }

    async getLeaveRequest(tenant: TenantScope, requestId: string, options?: LeaveRequestReadOptions) {
        const { orgId } = tenant;
        const record = await this.prisma.leaveRequest.findUnique({ where: { id: requestId } });
        if (record?.orgId !== orgId) {
            return null;
        }
        return mapPrismaLeaveRequestToDomain(record, { hoursPerDay: options?.hoursPerDay });
    }

    async getLeaveRequestsByEmployee(tenant: TenantScope, employeeId: string, options?: LeaveRequestReadOptions) {
        const { orgId } = tenant;
        const records = await this.prisma.leaveRequest.findMany({
            where: {
                orgId,
                userId: employeeId,
            },
            orderBy: { createdAt: 'desc' },
        });
        return records.map((record) => mapPrismaLeaveRequestToDomain(record, { hoursPerDay: options?.hoursPerDay }));
    }

    async getLeaveRequestsByOrganization(
        tenant: TenantScope,
        filters?: { status?: string; startDate?: Date; endDate?: Date },
        options?: LeaveRequestReadOptions,
    ) {
        const { orgId } = tenant;
        const records = await this.prisma.leaveRequest.findMany({
            where: {
                orgId,
                status: filters?.status ? mapDomainStatusToPrisma(filters.status as LeaveRequest['status']) : undefined,
                startDate: filters?.startDate ? { gte: filters.startDate } : undefined,
                endDate: filters?.endDate ? { lte: filters.endDate } : undefined,
            },
            orderBy: { createdAt: 'desc' },
        });
        return records.map((record) => mapPrismaLeaveRequestToDomain(record, { hoursPerDay: options?.hoursPerDay }));
    }

    async countLeaveRequestsByPolicy(tenant: TenantScope, policyId: string): Promise<number> {
        const { orgId } = tenant;
        return this.prisma.leaveRequest.count({
            where: {
                orgId,
                policyId,
            },
        });
    }
}
