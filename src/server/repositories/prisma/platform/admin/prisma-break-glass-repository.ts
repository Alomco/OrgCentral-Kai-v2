import type { IBreakGlassRepository, BreakGlassListFilters } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { breakGlassApprovalSchema } from '@/server/validators/platform/admin/break-glass-validators';
import { loadPlatformSettingJson, savePlatformSettingJson } from '@/server/repositories/prisma/platform/settings/platform-settings-json-store';

const BREAK_GLASS_KEY = 'platform-break-glass-approvals';

export class PrismaBreakGlassRepository extends BasePrismaRepository implements IBreakGlassRepository {
    async listApprovals(
        context: RepositoryAuthorizationContext,
        filters?: BreakGlassListFilters,
    ): Promise<BreakGlassApproval[]> {
        const approvals = await loadPlatformSettingJson(
            { prisma: this.prisma },
            BREAK_GLASS_KEY,
            breakGlassApprovalSchema.array(),
            [],
        );

        return approvals.filter((approval) =>
            approval.orgId === context.orgId &&
            (!filters?.scope || approval.scope === filters.scope) &&
            (!filters?.status || approval.status === filters.status)
        );
    }

    async getApproval(
        context: RepositoryAuthorizationContext,
        approvalId: string,
    ): Promise<BreakGlassApproval | null> {
        const approvals = await this.listApprovals(context);
        return approvals.find((approval) => approval.id === approvalId) ?? null;
    }

    async createApproval(
        context: RepositoryAuthorizationContext,
        approval: BreakGlassApproval,
    ): Promise<BreakGlassApproval> {
        const approvals = await this.listApprovals(context);
        const next = [...approvals, approval];
        await savePlatformSettingJson({ prisma: this.prisma }, BREAK_GLASS_KEY, next);
        return approval;
    }

    async updateApproval(
        context: RepositoryAuthorizationContext,
        approval: BreakGlassApproval,
    ): Promise<BreakGlassApproval> {
        const approvals = await this.listApprovals(context);
        const next = approvals.map((item) => (item.id === approval.id ? approval : item));
        await savePlatformSettingJson({ prisma: this.prisma }, BREAK_GLASS_KEY, next);
        return approval;
    }
}
