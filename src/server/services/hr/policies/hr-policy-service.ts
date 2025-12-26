import { AbstractHrService } from '@/server/services/hr/abstract-hr-service';
import type { HRPolicy, PolicyAcknowledgment } from '@/server/types/hr-ops-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
    AcknowledgePolicyInput,
    CreatePolicyInput,
    GetPolicyAcknowledgmentInput,
    GetPolicyInput,
    HrPolicyServiceDependencies,
    ListPoliciesInput,
    ListPolicyAcknowledgmentsInput,
    UpdatePolicyInput,
} from './hr-policy-service.types';
import {
    handleAcknowledgePolicy,
    handleCreatePolicy,
    handleGetPolicy,
    handleGetPolicyAcknowledgment,
    handleListPolicies,
    handleListPolicyAcknowledgments,
    handleUpdatePolicy,
    type HrPolicyServiceRuntime,
} from './hr-policy-service.operations';
export class HrPolicyService extends AbstractHrService {
    private readonly runtime: HrPolicyServiceRuntime;

    constructor(private readonly dependencies: HrPolicyServiceDependencies) {
        super();
        this.runtime = {
            dependencies: this.dependencies,
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            buildContext: this.buildContext.bind(this),
            executeInServiceContext: this.executeInServiceContext.bind(this),
            coerceAuthorization: this.coerceAuthorization.bind(this),
        };
    }

    async createPolicy(input: CreatePolicyInput): Promise<HRPolicy> {
        return handleCreatePolicy(this.runtime, input);
    }

    async updatePolicy(input: UpdatePolicyInput): Promise<HRPolicy> {
        return handleUpdatePolicy(this.runtime, input);
    }

    async listPolicies(input: ListPoliciesInput): Promise<HRPolicy[]> {
        return handleListPolicies(this.runtime, input);
    }

    async getPolicy(input: GetPolicyInput): Promise<HRPolicy | null> {
        return handleGetPolicy(this.runtime, input);
    }

    async acknowledgePolicy(input: AcknowledgePolicyInput): Promise<PolicyAcknowledgment> {
        return handleAcknowledgePolicy(this.runtime, input);
    }

    /**
     * Returns the acknowledgment for the policy's current version.
     * If the policy is not found, returns null.
     */
    async getPolicyAcknowledgment(
        input: GetPolicyAcknowledgmentInput,
    ): Promise<PolicyAcknowledgment | null> {
        return handleGetPolicyAcknowledgment(this.runtime, input);
    }

    async listPolicyAcknowledgments(input: ListPolicyAcknowledgmentsInput): Promise<PolicyAcknowledgment[]> {
        return handleListPolicyAcknowledgments(this.runtime, input);
    }

    private coerceAuthorization(value: unknown): RepositoryAuthorizationContext {
        return value as RepositoryAuthorizationContext;
    }
}
