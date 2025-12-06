import { Prisma } from '@prisma/client';
// No constructor required; use DI via BasePrismaRepository
import type { ILeaveBalanceRepository, LeaveBalanceCreateInput } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { buildLeaveBalanceMetadata, mapPrismaLeaveBalanceToDomain, normalizeLeaveBalanceMetadata } from '@/server/repositories/mappers/hr/leave/leave-mapper';
import { invalidateOrgCache, registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_LEAVE_BALANCES } from '@/server/repositories/cache-scopes';
import { EntityNotFoundError } from '@/server/errors';

export class PrismaLeaveBalanceRepository extends BasePrismaRepository implements ILeaveBalanceRepository {
    async createLeaveBalance(tenantId: string, balance: LeaveBalanceCreateInput): Promise<void> {
        const { policyId, ...balanceData } = balance;
        const periodStart = new Date(Date.UTC(balanceData.year, 0, 1));
        const periodEnd = new Date(Date.UTC(balanceData.year, 11, 31, 23, 59, 59, 999));

        await this.prisma.leaveBalance.create({
            data: {
                id: balanceData.id,
                orgId: tenantId,
                userId: balanceData.employeeId,
                policyId,
                periodStart,
                periodEnd,
                accruedHours: new Prisma.Decimal(balanceData.totalEntitlement),
                usedHours: new Prisma.Decimal(balanceData.used),
                carriedHours: new Prisma.Decimal(balanceData.pending),
                metadata: buildLeaveBalanceMetadata(balanceData),
            },
        });

        await invalidateOrgCache(tenantId, CACHE_SCOPE_LEAVE_BALANCES);
    }

    async updateLeaveBalance(
        tenantId: string,
        balanceId: string,
        updates: Partial<{ used: number; pending: number; available: number; updatedAt: Date }>,
    ): Promise<void> {
        const existing = await this.prisma.leaveBalance.findUnique({ where: { id: balanceId } });
        if (existing?.orgId !== tenantId) {
            throw new EntityNotFoundError('Leave balance', { id: balanceId, orgId: tenantId });
        }

        const metadata = normalizeLeaveBalanceMetadata(existing.metadata);

        if (updates.used !== undefined) {
            metadata.used = updates.used;
        }
        if (updates.pending !== undefined) {
            metadata.pending = updates.pending;
        }
        if (updates.available !== undefined) {
            metadata.available = updates.available;
        }

        await this.prisma.leaveBalance.update({
            where: { id: balanceId },
            data: {
                usedHours: updates.used !== undefined ? new Prisma.Decimal(updates.used) : undefined,
                carriedHours: updates.pending !== undefined ? new Prisma.Decimal(updates.pending) : undefined,
                metadata,
                updatedAt: updates.updatedAt,
            },
        });

        await invalidateOrgCache(tenantId, CACHE_SCOPE_LEAVE_BALANCES);
    }

    async getLeaveBalance(tenantId: string, balanceId: string) {
        registerOrgCacheTag(tenantId, CACHE_SCOPE_LEAVE_BALANCES);
        const record = await this.prisma.leaveBalance.findUnique({ where: { id: balanceId } });
        if (record?.orgId !== tenantId) {
            return null;
        }
        return mapPrismaLeaveBalanceToDomain(record);
    }

    async getLeaveBalancesByEmployeeAndYear(tenantId: string, employeeId: string, year: number) {
        registerOrgCacheTag(tenantId, CACHE_SCOPE_LEAVE_BALANCES);
        const periodStart = new Date(Date.UTC(year, 0, 1));
        const periodEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

        const records = await this.prisma.leaveBalance.findMany({
            where: {
                orgId: tenantId,
                userId: employeeId,
                periodStart: { gte: periodStart },
                periodEnd: { lte: periodEnd },
            },
        });

        return records.map(mapPrismaLeaveBalanceToDomain);
    }

    async getLeaveBalancesByEmployee(tenantId: string, employeeId: string) {
        registerOrgCacheTag(tenantId, CACHE_SCOPE_LEAVE_BALANCES);
        const records = await this.prisma.leaveBalance.findMany({
            where: {
                orgId: tenantId,
                userId: employeeId,
            },
            orderBy: { updatedAt: 'desc' },
        });

        return records.map(mapPrismaLeaveBalanceToDomain);
    }
}
