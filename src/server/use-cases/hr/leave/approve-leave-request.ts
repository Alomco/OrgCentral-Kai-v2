import type { ILeaveRequestRepository } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { ILeaveBalanceRepository } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { ILeavePolicyRepository } from '@/server/repositories/contracts/hr/leave/leave-policy-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { appLogger } from '@/server/logging/structured-logger';
import type { NotificationDispatchContract } from '@/server/services/notifications/notification-service.provider';
import { assertNonEmpty } from '@/server/use-cases/shared';
import {
    fetchLeaveRequest,
    assertLeaveRequestStatus,
    getCurrentTimestamp,
    invalidateLeaveCacheScopes,
    buildLeaveDecisionContext,
    reconcileBalanceForApproval,
} from './shared';
import type { LeaveDecisionContext } from './shared';

export interface ApproveLeaveRequestDependencies {
    leaveRequestRepository: ILeaveRequestRepository;
    leaveBalanceRepository: ILeaveBalanceRepository;
    leavePolicyRepository: ILeavePolicyRepository;
    organizationRepository: IOrganizationRepository;
    notificationDispatchService?: NotificationDispatchContract;
}

export interface ApproveLeaveRequestInput {
    authorization: RepositoryAuthorizationContext;
    requestId: string;
    approverId: string;
    comments?: string;
}

export interface ApproveLeaveRequestResult {
    success: true;
    requestId: string;
    approvedAt: string;
    decisionContext: LeaveDecisionContext;
}

export async function approveLeaveRequest(
    deps: ApproveLeaveRequestDependencies,
    input: ApproveLeaveRequestInput,
): Promise<ApproveLeaveRequestResult> {
    assertNonEmpty(input.requestId, 'Request ID');
    assertNonEmpty(input.approverId, 'Approver ID');

    const existingRequest = await fetchLeaveRequest(
        deps.leaveRequestRepository,
        input.authorization.tenantScope,
        input.requestId,
    );

    assertLeaveRequestStatus(existingRequest, 'submitted', 'approve');

    const approvedAt = getCurrentTimestamp();
    const decisionContext = buildLeaveDecisionContext(existingRequest);

    await deps.leaveRequestRepository.updateLeaveRequest(
        input.authorization.tenantScope,
        input.requestId,
        {
            status: 'approved',
            approvedBy: input.approverId,
            approvedAt,
            managerComments: input.comments,
        },
    );

    await reconcileBalanceForApproval(
        {
            leaveBalanceRepository: deps.leaveBalanceRepository,
            leavePolicyRepository: deps.leavePolicyRepository,
            organizationRepository: deps.organizationRepository,
        },
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

    await queueApprovalNotification(deps.notificationDispatchService, {
        authorization: input.authorization,
        request: existingRequest,
        approverId: input.approverId,
        approvedAt,
    });

    return {
        success: true,
        requestId: input.requestId,
        approvedAt,
        decisionContext,
    };
}

interface LeaveRequestSnapshot {
    id: string;
    userId?: string | null;
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
}

async function queueApprovalNotification(
    dispatcher: NotificationDispatchContract | undefined,
    params: {
        authorization: RepositoryAuthorizationContext;
        request: LeaveRequestSnapshot;
        approverId: string;
        approvedAt: string;
    },
): Promise<void> {
    if (!dispatcher || !params.request.userId) {
        return;
    }

    try {
        await dispatcher.dispatchNotification({
            authorization: params.authorization,
            notification: {
                templateKey: 'hr.leave.approved',
                channel: 'IN_APP',
                recipient: { userId: params.request.userId },
                data: {
                    requestId: params.request.id,
                    leaveType: params.request.leaveType,
                    approverId: params.approverId,
                    approvedAt: params.approvedAt,
                    startDate: params.request.startDate,
                    endDate: params.request.endDate,
                    totalDays: params.request.totalDays,
                },
            },
        });
    } catch (error) {
        appLogger.error('leave.approval.notification.enqueue.failed', {
            orgId: params.authorization.orgId,
            requestId: params.request.id,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
