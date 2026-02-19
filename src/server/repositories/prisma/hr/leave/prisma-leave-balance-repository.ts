import { Prisma } from '../../../../../generated/client';
// No constructor required; use DI via BasePrismaRepository
import type { ILeaveBalanceRepository, LeaveBalanceCreateInput } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { TenantScope } from '@/server/types/tenant';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { buildLeaveBalanceMetadata, mapPrismaLeaveBalanceToDomain, normalizeLeaveBalanceMetadata } from '@/server/repositories/mappers/hr/leave/leave-mapper';
import { invalidateOrgCache, registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_LEAVE_BALANCES } from '@/server/repositories/cache-scopes';
import { EntityNotFoundError } from '@/server/errors';

export class PrismaLeaveBalanceRepository extends BasePrismaRepository implements ILeaveBalanceRepository {
    async createLeaveBalance(tenant: TenantScope, balance: LeaveBalanceCreateInput): Promise<void> {
        const { orgId, auditBatchId } = tenant;
        const { policyId, ...balanceData } = balance;
        const periodStart = new Date(Date.UTC(balanceData.year, 0, 1));
        const periodEnd = new Date(Date.UTC(balanceData.year, 11, 31, 23, 59, 59, 999));

        await this.prisma.leaveBalance.create({
            data: {
                id: balanceData.id,
                orgId,
                userId: balanceData.employeeId,
                policyId,
                periodStart,
                periodEnd,
                accruedHours: new Prisma.Decimal(balanceData.totalEntitlement),
                usedHours: new Prisma.Decimal(balanceData.used),
                carriedHours: new Prisma.Decimal(balanceData.pending),
                dataClassification: balanceData.dataClassification,
                residencyTag: balanceData.dataResidency,
                auditSource: balanceData.auditSource,
                auditBatchId: balanceData.auditBatchId ?? auditBatchId,
                metadata: buildLeaveBalanceMetadata(balanceData),
            },
        });

        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_LEAVE_BALANCES,
            balanceData.dataClassification,
            balanceData.dataResidency,
        );
    }

    async updateLeaveBalance(
        tenant: TenantScope,
        balanceId: string,
        updates: Partial<{ totalEntitlement: number; used: number; pending: number; available: number; updatedAt: Date }>,
    ): Promise<void> {
        const { orgId } = tenant;
        const existing = await this.prisma.leaveBalance.findUnique({ where: { id: balanceId } });
        if (existing?.orgId !== orgId) {
            throw new EntityNotFoundError('Leave balance', { id: balanceId, orgId });
        }

        const metadata = normalizeLeaveBalanceMetadata(existing.metadata);

        if (updates.used !== undefined) {
            metadata.used = updates.used;
        }
        if (updates.pending !== undefined) {
            metadata.pending = updates.pending;
        }
        if (updates.totalEntitlement !== undefined) {
            metadata.totalEntitlement = updates.totalEntitlement;
        }
        if (updates.available !== undefined) {
            metadata.available = updates.available;
        }

        await this.prisma.leaveBalance.update({
            where: { id: balanceId },
            data: {
                accruedHours: updates.totalEntitlement !== undefined
                    ? new Prisma.Decimal(updates.totalEntitlement)
                    : undefined,
                usedHours: updates.used !== undefined ? new Prisma.Decimal(updates.used) : undefined,
                carriedHours: updates.pending !== undefined ? new Prisma.Decimal(updates.pending) : undefined,
                metadata,
                updatedAt: updates.updatedAt,
            },
        });

        await invalidateOrgCache(
            orgId,
            CACHE_SCOPE_LEAVE_BALANCES,
            existing.dataClassification,
            existing.residencyTag,
        );
    }

    async getLeaveBalance(tenant: TenantScope, balanceId: string) {
        const { orgId, dataClassification, dataResidency } = tenant;
        registerOrgCacheTag(orgId, CACHE_SCOPE_LEAVE_BALANCES, dataClassification, dataResidency);
        const record = await this.prisma.leaveBalance.findUnique({ where: { id: balanceId } });
        if (record?.orgId !== orgId) {
            return null;
        }
        return mapPrismaLeaveBalanceToDomain(record);
    }

    async getLeaveBalancesByEmployeeAndYear(tenant: TenantScope, employeeId: string, year: number) {
        const { orgId, dataClassification, dataResidency } = tenant;
        registerOrgCacheTag(orgId, CACHE_SCOPE_LEAVE_BALANCES, dataClassification, dataResidency);
        const periodStart = new Date(Date.UTC(year, 0, 1));
        const periodEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

        const records = await this.prisma.leaveBalance.findMany({
            where: {
                orgId,
                userId: employeeId,
                periodStart: { gte: periodStart },
                periodEnd: { lte: periodEnd },
            },
        });

        return records.map(mapPrismaLeaveBalanceToDomain);
    }

    async getLeaveBalancesByEmployee(tenant: TenantScope, employeeId: string) {
        const { orgId, dataClassification, dataResidency } = tenant;
        registerOrgCacheTag(orgId, CACHE_SCOPE_LEAVE_BALANCES, dataClassification, dataResidency);
        const records = await this.prisma.leaveBalance.findMany({
            where: {
                orgId,
                userId: employeeId,
            },
            orderBy: { updatedAt: 'desc' },
        });

        return records.map(mapPrismaLeaveBalanceToDomain);
    }

    async countLeaveBalancesByPolicy(tenant: TenantScope, policyId: string): Promise<number> {
        const { orgId } = tenant;
        return this.prisma.leaveBalance.count({
            where: {
                orgId,
                policyId,
            },
        });
    }
}
