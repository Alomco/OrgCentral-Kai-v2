import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { BillingPlan } from '@/server/types/platform/billing-plan';
import { enforcePermission } from '@/server/repositories/security';
import { parseBillingPlanUpdate, type BillingPlanUpdateInput } from '@/server/validators/platform/admin/billing-plan-validators';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';

export interface UpdateBillingPlanInput {
    authorization: RepositoryAuthorizationContext;
    request: BillingPlanUpdateInput;
}

export interface UpdateBillingPlanDependencies {
    billingPlanRepository: IBillingPlanRepository;
}

export async function updateBillingPlan(
    deps: UpdateBillingPlanDependencies,
    input: UpdateBillingPlanInput,
): Promise<BillingPlan> {
    enforcePermission(input.authorization, 'platformBillingPlans', 'update');

    const request = parseBillingPlanUpdate(input.request);
    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'billing-plan.update',
        }),
        10 * 60 * 1000,
        20,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for billing plan updates.');
    }
    const existing = await deps.billingPlanRepository.getPlan(input.authorization, request.id);

    if (!existing) {
        throw new ValidationError('Billing plan not found.');
    }

    const now = new Date().toISOString();

    const updated: BillingPlan = {
        ...existing,
        ...request,
        description: request.description ?? existing.description ?? null,
        effectiveTo: request.effectiveTo ?? existing.effectiveTo ?? null,
        updatedAt: now,
    };

    const saved = await deps.billingPlanRepository.updatePlan(input.authorization, updated);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'billing_plan.update',
        resource: 'platformBillingPlan',
        resourceId: saved.id,
        payload: { status: saved.status, cadence: saved.cadence },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return saved;
}
