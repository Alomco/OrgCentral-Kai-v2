import type { ILeaveRequestRepository } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { ILeaveBalanceRepository } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared';
import {
    fetchLeaveRequest,
    assertLeaveRequestStatus,
    getCurrentTimestamp,
    invalidateLeaveCacheScopes,
    buildLeaveDecisionContext,
    reconcileBalanceForPendingReduction,
} from './shared';
import type { LeaveDecisionContext } from './shared';

export interface RejectLeaveRequestDependencies {
    leaveRequestRepository: ILeaveRequestRepository;
    leaveBalanceRepository: ILeaveBalanceRepository;
}

export interface RejectLeaveRequestInput {
    authorization: RepositoryAuthorizationContext;
    requestId: string;
    rejectedBy: string;
    reason: string;
    comments?: string;
}

export interface RejectLeaveRequestResult {
    success: true;
    requestId: string;
    rejectedAt: string;
    decisionContext: LeaveDecisionContext;
}

export async function rejectLeaveRequest(
    deps: RejectLeaveRequestDependencies,
    input: RejectLeaveRequestInput,
): Promise<RejectLeaveRequestResult> {
    assertNonEmpty(input.requestId, 'Request ID');
    assertNonEmpty(input.rejectedBy, 'Rejector ID');
    assertNonEmpty(input.reason, 'Rejection reason');

    const existingRequest = await fetchLeaveRequest(
        deps.leaveRequestRepository,
        input.authorization.tenantScope,
        input.requestId,
    );

    assertLeaveRequestStatus(existingRequest, 'submitted', 'reject');

    const rejectedAt = getCurrentTimestamp();
    const decisionContext = buildLeaveDecisionContext(existingRequest);

    await deps.leaveRequestRepository.updateLeaveRequest(
        input.authorization.tenantScope,
        input.requestId,
        {
            status: 'rejected',
            rejectedBy: input.rejectedBy,
            rejectedAt,
            rejectionReason: input.reason,
            managerComments: input.comments,
        },
    );

    await reconcileBalanceForPendingReduction(
        { leaveBalanceRepository: deps.leaveBalanceRepository },
        {
            authorization: input.authorization,
            request: {
                employeeId: existingRequest.employeeId,
                leaveType: existingRequest.leaveType,
                startDate: existingRequest.startDate,
                totalDays: existingRequest.totalDays,
            },
        },
    );

    await invalidateLeaveCacheScopes(
        input.authorization,
        'requests',
        'balances',
    );

    return {
        success: true,
        requestId: input.requestId,
        rejectedAt,
        decisionContext,
    };
}
