import type { ILeaveRequestRepository } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { ILeaveBalanceRepository } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared';
import {
    fetchLeaveRequest,
    assertLeaveRequestNotInStatus,
    getCurrentTimestamp,
    invalidateLeaveCacheScopes,
    reconcileBalanceForPendingReduction,
    reconcileBalanceForUsedReduction,
} from './shared';
import type { LeaveBalanceAdjustmentContext } from './shared';

export interface CancelLeaveRequestDependencies {
    leaveRequestRepository: ILeaveRequestRepository;
    leaveBalanceRepository: ILeaveBalanceRepository;
}

export interface CancelLeaveRequestInput {
    authorization: RepositoryAuthorizationContext;
    requestId: string;
    cancelledBy: string;
    reason?: string;
}

export interface CancelLeaveRequestResult {
    success: true;
    requestId: string;
    cancelledAt: string;
}

export async function cancelLeaveRequest(
    deps: CancelLeaveRequestDependencies,
    input: CancelLeaveRequestInput,
): Promise<CancelLeaveRequestResult> {
    assertNonEmpty(input.requestId, 'Request ID');
    assertNonEmpty(input.cancelledBy, 'User ID');

    const existingRequest = await fetchLeaveRequest(
        deps.leaveRequestRepository,
        input.authorization.tenantScope,
        input.requestId,
    );

    assertLeaveRequestNotInStatus(existingRequest, ['cancelled', 'rejected'], 'cancel');
    const previousStatus = existingRequest.status;

    const cancelledAt = getCurrentTimestamp();

    await deps.leaveRequestRepository.updateLeaveRequest(
        input.authorization.tenantScope,
        input.requestId,
        {
            status: 'cancelled',
            cancelledBy: input.cancelledBy,
            cancelledAt,
            cancellationReason: input.reason,
        },
    );

    const cancellationContext: LeaveBalanceAdjustmentContext = {
        authorization: input.authorization,
        request: {
            employeeId: existingRequest.employeeId,
            leaveType: existingRequest.leaveType,
            startDate: existingRequest.startDate,
            totalDays: existingRequest.totalDays,
        },
    };

    if (previousStatus === 'approved') {
        await reconcileBalanceForUsedReduction(
            { leaveBalanceRepository: deps.leaveBalanceRepository },
            cancellationContext,
        );
    } else if (previousStatus === 'submitted') {
        await reconcileBalanceForPendingReduction(
            { leaveBalanceRepository: deps.leaveBalanceRepository },
            cancellationContext,
        );
    }

    await invalidateLeaveCacheScopes(
        input.authorization,
        'requests',
        'balances',
    );

    return {
        success: true,
        requestId: input.requestId,
        cancelledAt,
    };
}
