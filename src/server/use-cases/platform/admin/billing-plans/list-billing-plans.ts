import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { BillingPlan } from '@/server/types/platform/billing-plan';
import { enforcePermission } from '@/server/repositories/security';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListBillingPlansInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListBillingPlansDependencies {
    billingPlanRepository: IBillingPlanRepository;
}

export async function listBillingPlans(
    deps: ListBillingPlansDependencies,
    input: ListBillingPlansInput,
): Promise<BillingPlan[]> {
    enforcePermission(input.authorization, 'platformBillingPlans', 'read');
    const plans = await deps.billingPlanRepository.listPlans(input.authorization);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.billing.plans.list',
        resource: 'platformBillingPlan',
        payload: { count: plans.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return plans;
}
