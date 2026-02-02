import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BillingPlan, BillingPlanAssignment } from '@/server/types/platform/billing-plan';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { billingPlanSchema } from '@/server/validators/platform/admin/billing-plan-validators';
import { loadPlatformSettingJson, savePlatformSettingJson } from '@/server/repositories/prisma/platform/settings/platform-settings-json-store';
import { z } from 'zod';

const BILLING_PLANS_KEY = 'platform-billing-plans';
const BILLING_ASSIGNMENTS_KEY = 'platform-billing-plan-assignments';

const billingPlanAssignmentSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    tenantId: z.uuid(),
    planId: z.uuid(),
    effectiveFrom: z.string(),
    effectiveTo: z.string().nullable().optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'RETIRED']),
    createdAt: z.string(),
    updatedAt: z.string(),
}) satisfies z.ZodType<BillingPlanAssignment>;

export class PrismaBillingPlanRepository extends BasePrismaRepository implements IBillingPlanRepository {
    async listPlans(context: RepositoryAuthorizationContext): Promise<BillingPlan[]> {
        const plans = await loadPlatformSettingJson(
            { prisma: this.prisma },
            BILLING_PLANS_KEY,
            billingPlanSchema.array(),
            [],
        );
        return plans.filter((plan) => plan.orgId === context.orgId);
    }

    async getPlan(context: RepositoryAuthorizationContext, planId: string): Promise<BillingPlan | null> {
        const plans = await this.listPlans(context);
        return plans.find((plan) => plan.id === planId) ?? null;
    }

    async createPlan(context: RepositoryAuthorizationContext, plan: BillingPlan): Promise<BillingPlan> {
        const plans = await this.listPlans(context);
        const next = [...plans, plan];
        await savePlatformSettingJson({ prisma: this.prisma }, BILLING_PLANS_KEY, next);
        return plan;
    }

    async updatePlan(context: RepositoryAuthorizationContext, plan: BillingPlan): Promise<BillingPlan> {
        const plans = await this.listPlans(context);
        const next = plans.map((item) => (item.id === plan.id ? plan : item));
        await savePlatformSettingJson({ prisma: this.prisma }, BILLING_PLANS_KEY, next);
        return plan;
    }

    async listAssignments(context: RepositoryAuthorizationContext): Promise<BillingPlanAssignment[]> {
        const assignments = await loadPlatformSettingJson(
            { prisma: this.prisma },
            BILLING_ASSIGNMENTS_KEY,
            billingPlanAssignmentSchema.array(),
            [],
        );
        return assignments.filter((assignment) => assignment.orgId === context.orgId);
    }

    async createAssignment(
        context: RepositoryAuthorizationContext,
        assignment: BillingPlanAssignment,
    ): Promise<BillingPlanAssignment> {
        const assignments = await this.listAssignments(context);
        const next = [...assignments, assignment];
        await savePlatformSettingJson({ prisma: this.prisma }, BILLING_ASSIGNMENTS_KEY, next);
        return assignment;
    }
}
