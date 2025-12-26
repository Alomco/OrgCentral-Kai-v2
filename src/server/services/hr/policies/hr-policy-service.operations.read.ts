import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { assertPolicyAcknowledgmentActor, assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import type { HRPolicy, PolicyAcknowledgment } from '@/server/types/hr-ops-types';
import type {
    GetPolicyAcknowledgmentInput,
    GetPolicyInput,
    ListPoliciesInput,
    ListPolicyAcknowledgmentsInput,
} from './hr-policy-service.types';
import { getHrPolicy } from '../../../use-cases/hr/policies/get-hr-policy';
import { getPolicyAcknowledgment } from '../../../use-cases/hr/policies/get-policy-acknowledgment';
import { listHrPolicies } from '../../../use-cases/hr/policies/list-hr-policies';
import { listPolicyAcknowledgments } from '../../../use-cases/hr/policies/list-policy-acknowledgments';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import type { HrPolicyServiceRuntime } from './hr-policy-service.operations.types';

export async function handleListPolicies(
    runtime: HrPolicyServiceRuntime,
    input: ListPoliciesInput,
): Promise<HRPolicy[]> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { filters: input.filters },
    });

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.list',
            status: input.filters?.status,
            category: input.filters?.category,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.list', () =>
        listHrPolicies(
            { policyRepository: runtime.dependencies.policyRepository },
            { authorization, filters: input.filters },
        ),
    );
}

export async function handleGetPolicy(
    runtime: HrPolicyServiceRuntime,
    input: GetPolicyInput,
): Promise<HRPolicy | null> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { policyId: input.policyId },
    });

    assertNonEmpty(input.policyId, 'policyId');

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.get',
            policyId: input.policyId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.get', () =>
        getHrPolicy(
            { policyRepository: runtime.dependencies.policyRepository },
            { authorization, policyId: input.policyId },
        ),
    );
}

export async function handleGetPolicyAcknowledgment(
    runtime: HrPolicyServiceRuntime,
    input: GetPolicyAcknowledgmentInput,
): Promise<PolicyAcknowledgment | null> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { policyId: input.policyId, userId: input.userId },
    });

    assertPolicyAcknowledgmentActor(authorization, input.userId);

    assertNonEmpty(input.userId, 'userId');
    assertNonEmpty(input.policyId, 'policyId');

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.acknowledgment.get',
            policyId: input.policyId,
            userId: input.userId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.acknowledgment.get', () =>
        getPolicyAcknowledgment(
            {
                policyRepository: runtime.dependencies.policyRepository,
                acknowledgmentRepository: runtime.dependencies.acknowledgmentRepository,
            },
            { authorization, policyId: input.policyId, userId: input.userId },
        ),
    );
}

export async function handleListPolicyAcknowledgments(
    runtime: HrPolicyServiceRuntime,
    input: ListPolicyAcknowledgmentsInput,
): Promise<PolicyAcknowledgment[]> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { policyId: input.policyId, version: input.version },
    });

    assertPrivilegedOrgPolicyActor(authorization);

    assertNonEmpty(input.policyId, 'policyId');

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.acknowledgments.list',
            policyId: input.policyId,
            version: input.version,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.acknowledgments.list', () =>
        listPolicyAcknowledgments(
            {
                policyRepository: runtime.dependencies.policyRepository,
                acknowledgmentRepository: runtime.dependencies.acknowledgmentRepository,
            },
            { authorization, policyId: input.policyId, version: input.version },
        ),
    );
}
