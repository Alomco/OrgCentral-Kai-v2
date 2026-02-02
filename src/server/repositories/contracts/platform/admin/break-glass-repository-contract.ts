import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BreakGlassApproval, BreakGlassScope } from '@/server/types/platform/break-glass';

export interface BreakGlassListFilters {
    scope?: BreakGlassScope;
    status?: BreakGlassApproval['status'];
}

export interface IBreakGlassRepository {
    listApprovals(
        context: RepositoryAuthorizationContext,
        filters?: BreakGlassListFilters,
    ): Promise<BreakGlassApproval[]>;

    getApproval(
        context: RepositoryAuthorizationContext,
        approvalId: string,
    ): Promise<BreakGlassApproval | null>;

    createApproval(
        context: RepositoryAuthorizationContext,
        approval: BreakGlassApproval,
    ): Promise<BreakGlassApproval>;

    updateApproval(
        context: RepositoryAuthorizationContext,
        approval: BreakGlassApproval,
    ): Promise<BreakGlassApproval>;
}
