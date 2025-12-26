import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { assertPolicyAcknowledgmentActor, assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import type { HRPolicy, PolicyAcknowledgment } from '@/server/types/hr-ops-types';
import type {
    AcknowledgePolicyDTO,
    AcknowledgePolicyInput,
    CreatePolicyInput,
    UpdatePolicyInput,
} from './hr-policy-service.types';
import { assertValidDate, assertValidPolicyDateRange, validateCreatePolicy, validateUpdatePolicy } from './hr-policy-service.validators';
import { emitPolicyAcknowledgedNotification, emitPolicyUpdateNotifications } from './hr-policy-service.notifications';
import { acknowledgeHrPolicy } from '../../../use-cases/hr/policies/acknowledge-hr-policy';
import { createHrPolicy } from '../../../use-cases/hr/policies/create-hr-policy';
import { updateHrPolicy } from '../../../use-cases/hr/policies/update-hr-policy';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import type { HrPolicyServiceRuntime } from './hr-policy-service.operations.types';

export async function handleCreatePolicy(
    runtime: HrPolicyServiceRuntime,
    input: CreatePolicyInput,
): Promise<HRPolicy> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { title: input.policy.title, category: input.policy.category },
    });
    assertPrivilegedOrgPolicyActor(authorization);

    validateCreatePolicy(input.policy);

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.create',
            title: input.policy.title,
            category: input.policy.category,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.create', async () => {
        const policy = await createHrPolicy(
            { policyRepository: runtime.dependencies.policyRepository },
            { authorization, policy: input.policy },
        );

        await emitPolicyUpdateNotifications({
            authorization,
            policy,
            event: 'created',
            employeeProfileRepository: runtime.dependencies.employeeProfileRepository,
            excludeUserId: authorization.userId,
        });

        return policy;
    });
}

export async function handleUpdatePolicy(
    runtime: HrPolicyServiceRuntime,
    input: UpdatePolicyInput,
): Promise<HRPolicy> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { policyId: input.policyId },
    });
    assertPrivilegedOrgPolicyActor(authorization);

    assertNonEmpty(input.policyId, 'policyId');
    validateUpdatePolicy(input.updates);

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.update',
            policyId: input.policyId,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.update', async () => {
        if (input.updates.effectiveDate && input.updates.expiryDate) {
            assertValidPolicyDateRange(input.updates.effectiveDate, input.updates.expiryDate);
        }

        const policy = await updateHrPolicy(
            { policyRepository: runtime.dependencies.policyRepository },
            { authorization, policyId: input.policyId, updates: input.updates },
        );

        await emitPolicyUpdateNotifications({
            authorization,
            policy,
            event: 'updated',
            employeeProfileRepository: runtime.dependencies.employeeProfileRepository,
            excludeUserId: authorization.userId,
        });

        return policy;
    });
}

export async function handleAcknowledgePolicy(
    runtime: HrPolicyServiceRuntime,
    input: AcknowledgePolicyInput,
): Promise<PolicyAcknowledgment> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.ACKNOWLEDGE,
        resourceType: HR_RESOURCE.HR_POLICY,
        resourceAttributes: { policyId: input.policyId, userId: input.userId, version: input.version },
    });

    assertPolicyAcknowledgmentActor(authorization, input.userId);

    assertNonEmpty(input.userId, 'userId');
    assertNonEmpty(input.policyId, 'policyId');
    assertNonEmpty(input.version, 'version');

    const acknowledgedAt = input.acknowledgedAt ?? new Date();
    assertValidDate(acknowledgedAt, 'acknowledgedAt');

    const context = runtime.buildContext(authorization, {
        metadata: {
            auditSource: 'service:hr.policies.policy.acknowledge',
            policyId: input.policyId,
            userId: input.userId,
            version: input.version,
        },
    });

    return runtime.executeInServiceContext(context, 'hr.policies.policy.acknowledge', async () => {
        const acknowledgment: AcknowledgePolicyDTO = {
            orgId: authorization.orgId,
            userId: input.userId,
            policyId: input.policyId,
            version: input.version,
            acknowledgedAt,
            ipAddress: input.ipAddress ?? null,
            metadata: input.metadata,
        };

        const result = await acknowledgeHrPolicy(
            {
                policyRepository: runtime.dependencies.policyRepository,
                acknowledgmentRepository: runtime.dependencies.acknowledgmentRepository,
            },
            { authorization, acknowledgment },
        );

        await emitPolicyAcknowledgedNotification({
            authorization,
            policy: result.policy,
            userId: input.userId,
            acknowledgedAt,
        });

        return result.acknowledgment;
    });
}
