import { z } from 'zod';
import { LEAVE_POLICY_TYPES } from '@/server/types/leave-types';
import type { LeavePolicy } from '@/server/types/leave-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import { assertPrivilegedOrgPolicyActor } from '@/server/security/authorization/hr-policies';
import { AuthorizationError, InfrastructureError, ValidationError } from '@/server/errors';
import { invalidateLeaveCacheScopes } from '@/server/use-cases/hr/leave/shared/cache-helpers';

const leavePolicyTypeValues = [...LEAVE_POLICY_TYPES] as [
    (typeof LEAVE_POLICY_TYPES)[number],
    ...(typeof LEAVE_POLICY_TYPES)[number][],
];

export const createLeavePolicyInputSchema = z.object({
    orgId: z.uuid(),
    name: z.string().trim().min(1).max(120),
    type: z.enum(leavePolicyTypeValues),
    accrualAmount: z.coerce.number().nonnegative().max(366),
});

export type CreateLeavePolicyInput = z.infer<typeof createLeavePolicyInputSchema>;

export interface CreateLeavePolicyDependencies {
    leavePolicyRepository: ILeavePolicyRepository;
}

export interface CreateLeavePolicyRequest {
    authorization: RepositoryAuthorizationContext;
    payload: CreateLeavePolicyInput;
}

export interface CreateLeavePolicyResult {
    policy: LeavePolicy;
}

export async function createLeavePolicy(
    deps: CreateLeavePolicyDependencies,
    request: CreateLeavePolicyRequest,
): Promise<CreateLeavePolicyResult> {
    assertPrivilegedOrgPolicyActor(request.authorization);

    if (request.payload.orgId !== request.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant leave policy operation denied.');
    }

    const existing = await deps.leavePolicyRepository.getLeavePolicyByName(
        request.authorization.tenantScope,
        request.payload.name,
    );

    if (existing) {
        throw new ValidationError('A leave policy with this name already exists for the organization.', {
            orgId: request.authorization.orgId,
            name: request.payload.name,
        });
    }

    const now = new Date().toISOString();
    const policyToCreate: Omit<LeavePolicy, 'id' | 'createdAt' | 'updatedAt'> = {
        orgId: request.authorization.orgId,
        dataResidency: request.authorization.dataResidency,
        dataClassification: request.authorization.dataClassification,
        auditSource: request.authorization.auditSource,
        auditBatchId: request.authorization.auditBatchId,
        departmentId: null,
        name: request.payload.name,
        policyType: request.payload.type,
        accrualFrequency: 'YEARLY',
        accrualAmount: request.payload.accrualAmount,
        carryOverLimit: null,
        requiresApproval: true,
        isDefault: false,
        activeFrom: now,
        activeTo: null,
        statutoryCompliance: false,
        maxConsecutiveDays: null,
        allowNegativeBalance: false,
        metadata: null,
    };

    await deps.leavePolicyRepository.createLeavePolicy(
        request.authorization.tenantScope,
        policyToCreate,
    );

    await invalidateLeaveCacheScopes(request.authorization, 'policies');

    const created = await deps.leavePolicyRepository.getLeavePolicyByName(
        request.authorization.tenantScope,
        request.payload.name,
    );

    if (!created) {
        throw new InfrastructureError('Leave policy was created but could not be reloaded.');
    }

    return { policy: created };
}
