import type { ILeaveRequestRepository } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { invalidateLeaveCacheScopes } from './shared';
import { resolveLeavePolicyId } from './utils/resolve-leave-policy';

export interface SubmitLeaveRequestDependencies {
    leaveRequestRepository: ILeaveRequestRepository;
    leavePolicyRepository: ILeavePolicyRepository;
}

export interface SubmitLeaveRequestInput {
    authorization: RepositoryAuthorizationContext;
    request: Omit<
        LeaveRequest,
        'createdAt' | 'orgId' | 'dataResidency' | 'dataClassification' | 'auditSource' | 'auditBatchId'
    > & { hoursPerDay?: number };
}

export interface SubmitLeaveRequestResult {
    success: true;
    requestId: string;
    policyId: string;
}

export async function submitLeaveRequestWithPolicy(
    { leaveRequestRepository, leavePolicyRepository }: SubmitLeaveRequestDependencies,
    { authorization, request }: SubmitLeaveRequestInput,
): Promise<SubmitLeaveRequestResult> {
    assertNonEmpty(request.id, 'Leave request ID');
    assertNonEmpty(request.employeeId, 'Employee ID');
    assertNonEmpty(request.leaveType, 'Leave type');

    const policyId = await resolveLeavePolicyId(
        { leavePolicyRepository },
        authorization.tenantScope,
        request.leaveType,
    );

    await leaveRequestRepository.createLeaveRequest(authorization.tenantScope, {
        ...request,
        orgId: authorization.orgId,
        dataResidency: authorization.dataResidency,
        dataClassification: authorization.dataClassification,
        auditSource: authorization.auditSource,
        auditBatchId: authorization.auditBatchId,
        policyId,
    });

    await invalidateLeaveCacheScopes(authorization, 'requests');

    return {
        success: true,
        requestId: request.id,
        policyId,
    };
}
