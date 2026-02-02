import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IPlatformSubscriptionRepository } from '@/server/repositories/contracts/platform/admin/platform-subscription-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { BillingGateway, BillingProrationBehavior } from '@/server/services/billing/billing-gateway';
import type { BillingPlanAssignment } from '@/server/types/platform/billing-plan';
import { enforcePermission } from '@/server/repositories/security';
import { parseBillingPlanAssign, type BillingPlanAssignInput } from '@/server/validators/platform/admin/billing-plan-validators';
import { ValidationError } from '@/server/errors';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';

export interface AssignBillingPlanInput {
    authorization: RepositoryAuthorizationContext;
    request: BillingPlanAssignInput;
}

export interface AssignBillingPlanDependencies {
    billingPlanRepository: IBillingPlanRepository;
    subscriptionRepository: IPlatformSubscriptionRepository;
    billingGateway: BillingGateway;
    tenantRepository: IPlatformTenantRepository;
}

export async function assignBillingPlanToTenant(
    deps: AssignBillingPlanDependencies,
    input: AssignBillingPlanInput,
): Promise<BillingPlanAssignment> {
    enforcePermission(input.authorization, 'platformBillingPlans', 'assign');

    const request = parseBillingPlanAssign(input.request);

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: 'billing-plan-assign',
        }),
        10 * 60 * 1000,
        10,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for billing plan assignment.');
    }

    await requireTenantInScope(
        deps.tenantRepository,
        input.authorization,
        request.tenantId,
        'Tenant not found or not within allowed scope for billing assignments.',
    );

    const plan = await deps.billingPlanRepository.getPlan(input.authorization, request.planId);
    if (!plan) {
        throw new ValidationError('Billing plan not found.');
    }
    if (plan.status !== 'ACTIVE') {
        throw new ValidationError('Only active billing plans can be assigned.');
    }

    const subscription = await deps.subscriptionRepository.getSubscriptionByOrgId(
        input.authorization,
        request.tenantId,
    );
    if (!subscription) {
        throw new ValidationError('Tenant subscription not found.');
    }

    const effectiveFrom = request.effectiveFrom ? new Date(request.effectiveFrom) : new Date();
    const now = new Date();

    let status: BillingPlanAssignment['status'] = 'PENDING';
    if (effectiveFrom <= now) {
        await deps.billingGateway.updateSubscription({
            subscriptionId: subscription.stripeSubscriptionId,
            subscriptionItemId: subscription.stripeSubscriptionItemId ?? undefined,
            priceId: plan.stripePriceId,
            prorationBehavior: request.prorationBehavior as BillingProrationBehavior | undefined,
        });

        await deps.subscriptionRepository.updateSubscriptionPrice(
            input.authorization,
            request.tenantId,
            plan.stripePriceId,
        );

        status = 'ACTIVE';
    }

    const assignment: BillingPlanAssignment = {
        id: randomUUID(),
        orgId: input.authorization.orgId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        tenantId: request.tenantId,
        planId: request.planId,
        effectiveFrom: effectiveFrom.toISOString(),
        effectiveTo: null,
        status,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };

    await deps.billingPlanRepository.createAssignment(input.authorization, assignment);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'POLICY_CHANGE',
        action: 'billing_plan.assign',
        resource: 'platformBillingPlan',
        resourceId: plan.id,
        payload: { tenantId: request.tenantId, status },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return assignment;
}
