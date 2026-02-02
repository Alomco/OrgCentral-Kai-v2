import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { BillingPlan, BillingPlanAssignment } from '@/server/types/platform/billing-plan';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IPlatformSubscriptionRepository } from '@/server/repositories/contracts/platform/admin/platform-subscription-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import {
    buildBillingPlanServiceDependencies,
    type BillingPlanServiceDependencyOptions,
} from '@/server/repositories/providers/platform/admin/billing-plan-service-dependencies';
import { resolveBillingConfig } from '@/server/services/billing/billing-config';
import { StripeBillingGateway } from '@/server/services/billing/stripe-billing-gateway';
import type { BillingGateway } from '@/server/services/billing/billing-gateway';
import { listBillingPlans } from '@/server/use-cases/platform/admin/billing-plans/list-billing-plans';
import { createBillingPlan } from '@/server/use-cases/platform/admin/billing-plans/create-billing-plan';
import { updateBillingPlan } from '@/server/use-cases/platform/admin/billing-plans/update-billing-plan';
import { assignBillingPlanToTenant } from '@/server/use-cases/platform/admin/billing-plans/assign-billing-plan';
import { listBillingAssignments } from '@/server/use-cases/platform/admin/billing-plans/list-billing-assignments';
import type { BillingPlanAssignInput, BillingPlanCreateInput, BillingPlanUpdateInput } from '@/server/validators/platform/admin/billing-plan-validators';

export interface BillingPlanServiceDependencies {
    billingPlanRepository: IBillingPlanRepository;
    subscriptionRepository: IPlatformSubscriptionRepository;
    billingGateway: BillingGateway;
    tenantRepository: IPlatformTenantRepository;
}

export interface BillingPlanServiceContract {
    listBillingPlans(authorization: RepositoryAuthorizationContext): Promise<BillingPlan[]>;
    createBillingPlan(
        authorization: RepositoryAuthorizationContext,
        request: BillingPlanCreateInput,
    ): Promise<BillingPlan>;
    updateBillingPlan(
        authorization: RepositoryAuthorizationContext,
        request: BillingPlanUpdateInput,
    ): Promise<BillingPlan>;
    assignBillingPlan(
        authorization: RepositoryAuthorizationContext,
        request: BillingPlanAssignInput,
    ): Promise<BillingPlanAssignment>;
    listBillingAssignments(authorization: RepositoryAuthorizationContext): Promise<BillingPlanAssignment[]>;
}

export class BillingPlanService extends AbstractBaseService implements BillingPlanServiceContract {
    constructor(private readonly deps: BillingPlanServiceDependencies) {
        super();
    }

    async listBillingPlans(authorization: RepositoryAuthorizationContext): Promise<BillingPlan[]> {
        return this.runOperation(
            'platform.admin.billing-plans.list',
            authorization,
            undefined,
            () => listBillingPlans(this.deps, { authorization }),
        );
    }

    async createBillingPlan(
        authorization: RepositoryAuthorizationContext,
        request: BillingPlanCreateInput,
    ): Promise<BillingPlan> {
        return this.runOperation(
            'platform.admin.billing-plans.create',
            authorization,
            undefined,
            () => createBillingPlan(this.deps, { authorization, request }),
        );
    }

    async updateBillingPlan(
        authorization: RepositoryAuthorizationContext,
        request: BillingPlanUpdateInput,
    ): Promise<BillingPlan> {
        return this.runOperation(
            'platform.admin.billing-plans.update',
            authorization,
            undefined,
            () => updateBillingPlan(this.deps, { authorization, request }),
        );
    }

    async assignBillingPlan(
        authorization: RepositoryAuthorizationContext,
        request: BillingPlanAssignInput,
    ): Promise<BillingPlanAssignment> {
        return this.runOperation(
            'platform.admin.billing-plans.assign',
            authorization,
            undefined,
            () => assignBillingPlanToTenant(this.deps, { authorization, request }),
        );
    }

    async listBillingAssignments(
        authorization: RepositoryAuthorizationContext,
    ): Promise<BillingPlanAssignment[]> {
        return this.runOperation(
            'platform.admin.billing-assignments.list',
            authorization,
            undefined,
            () => listBillingAssignments(this.deps, { authorization }),
        );
    }

    private runOperation<TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ): Promise<TResult> {
        const context = this.buildContext(authorization, { metadata });
        return this.executeInServiceContext(context, operation, handler);
    }

    private buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId ?? authorization.correlationId,
            metadata: options?.metadata,
        };
    }
}

const sharedDependencies: BillingPlanServiceDependencies = {
    ...buildBillingPlanServiceDependencies(),
    billingGateway: buildBillingGateway(),
};
const sharedService = new BillingPlanService(sharedDependencies);

function buildBillingGateway(): BillingGateway {
    const config = resolveBillingConfig();
    if (!config) {
        throw new Error('Billing is not configured.');
    }
    return new StripeBillingGateway(config);
}

function resolveDependencies(
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): BillingPlanServiceDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }

    const repoDependencies = buildBillingPlanServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });

    return {
        ...repoDependencies,
        billingGateway: overrides?.billingGateway ?? sharedDependencies.billingGateway,
    };
}

export function getBillingPlanService(
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): BillingPlanService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new BillingPlanService(resolveDependencies(overrides, options));
}

export async function listBillingPlansService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): Promise<BillingPlan[]> {
    return getBillingPlanService(overrides, options).listBillingPlans(authorization);
}

export async function createBillingPlanService(
    authorization: RepositoryAuthorizationContext,
    request: BillingPlanCreateInput,
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): Promise<BillingPlan> {
    return getBillingPlanService(overrides, options).createBillingPlan(authorization, request);
}

export async function updateBillingPlanService(
    authorization: RepositoryAuthorizationContext,
    request: BillingPlanUpdateInput,
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): Promise<BillingPlan> {
    return getBillingPlanService(overrides, options).updateBillingPlan(authorization, request);
}

export async function assignBillingPlanService(
    authorization: RepositoryAuthorizationContext,
    request: BillingPlanAssignInput,
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): Promise<BillingPlanAssignment> {
    return getBillingPlanService(overrides, options).assignBillingPlan(authorization, request);
}

export async function listBillingAssignmentsService(
    authorization: RepositoryAuthorizationContext,
    overrides?: Partial<BillingPlanServiceDependencies>,
    options?: BillingPlanServiceDependencyOptions,
): Promise<BillingPlanAssignment[]> {
    return getBillingPlanService(overrides, options).listBillingAssignments(authorization);
}
