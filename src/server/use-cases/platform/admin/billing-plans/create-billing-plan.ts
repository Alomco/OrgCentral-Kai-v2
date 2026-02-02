import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { BillingPlan } from '@/server/types/platform/billing-plan';
import { enforcePermission } from '@/server/repositories/security';
import { parseBillingPlanCreate, type BillingPlanCreateInput } from '@/server/validators/platform/admin/billing-plan-validators';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';

export interface CreateBillingPlanInput {
    authorization: RepositoryAuthorizationContext;
    request: BillingPlanCreateInput;
}

export interface CreateBillingPlanDependencies {
    billingPlanRepository: IBillingPlanRepository;
}

export async function createBillingPlan(
    deps: CreateBillingPlanDependencies,
    input: CreateBillingPlanInput,
): Promise<BillingPlan> {
    enforcePermission(input.authorization, 'platformBillingPlans', 'create');

    const request = parseBillingPlanCreate(input.request);
    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'billing-plan.create',
        }),
        10 * 60 * 1000,
        20,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for billing plan creation.');
    }
    const now = new Date().toISOString();

    const plan: BillingPlan = {
        id: randomUUID(),
        orgId: input.authorization.orgId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        name: request.name,
        description: request.description ?? null,
        stripePriceId: request.stripePriceId,
        currency: request.currency,
        amountCents: request.amountCents,
        cadence: request.cadence,
        features: request.features,
        limits: request.limits,
        status: request.status,
        effectiveFrom: request.effectiveFrom,
        effectiveTo: request.effectiveTo ?? null,
        createdAt: now,
        updatedAt: now,
    };

    const created = await deps.billingPlanRepository.createPlan(input.authorization, plan);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'billing_plan.create',
        resource: 'platformBillingPlan',
        resourceId: created.id,
        payload: { name: created.name, status: created.status },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return created;
}
