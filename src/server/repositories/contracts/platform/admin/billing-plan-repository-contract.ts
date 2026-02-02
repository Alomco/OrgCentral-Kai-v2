import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BillingPlan, BillingPlanAssignment } from '@/server/types/platform/billing-plan';

export interface IBillingPlanRepository {
    listPlans(context: RepositoryAuthorizationContext): Promise<BillingPlan[]>;
    getPlan(context: RepositoryAuthorizationContext, planId: string): Promise<BillingPlan | null>;
    createPlan(context: RepositoryAuthorizationContext, plan: BillingPlan): Promise<BillingPlan>;
    updatePlan(context: RepositoryAuthorizationContext, plan: BillingPlan): Promise<BillingPlan>;

    listAssignments(context: RepositoryAuthorizationContext): Promise<BillingPlanAssignment[]>;
    createAssignment(
        context: RepositoryAuthorizationContext,
        assignment: BillingPlanAssignment,
    ): Promise<BillingPlanAssignment>;
}
