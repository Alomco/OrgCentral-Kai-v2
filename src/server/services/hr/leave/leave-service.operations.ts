import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    resolveEmployeeFromProfile,
    safelyDispatchNotification,
    sendApprovalNotification,
    sendCancelNotification,
    sendRejectionNotification,
    serializeLeaveFilters,
} from './leave-service.helpers';
import {
    cancelLeaveRequest,
    getLeaveRequests,
    submitLeaveRequestWithPolicy,
    approveLeaveRequest,
    rejectLeaveRequest,
} from '@/server/use-cases/hr/leave';
import type {
    CancelLeaveRequestInput,
    CancelLeaveRequestResult,
    GetLeaveRequestsInput,
    GetLeaveRequestsResult,
    SubmitLeaveRequestInput,
    SubmitLeaveRequestResult,
    ApproveLeaveRequestInput,
    ApproveLeaveRequestResult,
    RejectLeaveRequestInput,
    RejectLeaveRequestResult,
} from '@/server/use-cases/hr/leave';
import type { LeaveServiceDependencies } from './leave-service';
import type { LeaveDecisionContext } from '@/server/use-cases/hr/leave/shared/leave-request-helpers';
import type { LeaveNotificationLogger } from './leave-service.helpers';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';

export interface LeaveServiceRuntime {
    ensureOrgAccess: (
        authorization: RepositoryAuthorizationContext,
        guard?: {
            action?: string;
            resourceType?: string;
            resourceAttributes?: Record<string, unknown>;
        },
    ) => Promise<void>;
    coerceAuthorization: (value: unknown) => RepositoryAuthorizationContext;
    coerceDecisionContext: (value: unknown) => LeaveDecisionContext;
    runOperation: <TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ) => Promise<TResult>;
    dependencies: LeaveServiceDependencies;
    logger: LeaveNotificationLogger;
}

export async function handleSubmitLeaveRequest(
    runtime: LeaveServiceRuntime,
    input: SubmitLeaveRequestInput,
): Promise<SubmitLeaveRequestResult> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE.HR_LEAVE,
        resourceAttributes: { requestId: input.request.id, targetUserId: input.request.userId },
    });
    const normalizedRequest = await resolveEmployeeFromProfile(
        runtime.dependencies.profileRepository,
        authorization,
        input.request.userId,
        input.request.employeeId,
        input.request.employeeName,
    );

    return runtime.runOperation(
        'hr.leave.submit',
        authorization,
        { requestId: input.request.id, leaveType: input.request.leaveType },
        () =>
            submitLeaveRequestWithPolicy(runtime.dependencies, {
                ...input,
                authorization,
                request: {
                    ...input.request,
                    employeeId: normalizedRequest.employeeId,
                    employeeName: normalizedRequest.employeeName,
                },
            }),
    );
}

export async function handleApproveLeaveRequest(
    runtime: LeaveServiceRuntime,
    input: ApproveLeaveRequestInput,
): Promise<ApproveLeaveRequestResult> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.APPROVE,
        resourceType: HR_RESOURCE.HR_LEAVE,
        resourceAttributes: { requestId: input.requestId, approverId: input.approverId },
    });
    const result = await runtime.runOperation(
        'hr.leave.approve',
        authorization,
        { requestId: input.requestId, approverId: input.approverId },
        () => approveLeaveRequest(runtime.dependencies, input),
    );

    const approvalContext = runtime.coerceDecisionContext(result.decisionContext);

    await safelyDispatchNotification(
        () =>
            sendApprovalNotification(
                authorization,
                approvalContext,
                runtime.dependencies.hrNotificationService,
                runtime.logger,
            ),
        'Failed to send leave approval notification',
        { orgId: authorization.orgId, requestId: result.requestId },
        runtime.logger,
    );

    return result;
}

export async function handleRejectLeaveRequest(
    runtime: LeaveServiceRuntime,
    input: RejectLeaveRequestInput,
): Promise<RejectLeaveRequestResult> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.APPROVE,
        resourceType: HR_RESOURCE.HR_LEAVE,
        resourceAttributes: { requestId: input.requestId, rejectedBy: input.rejectedBy },
    });
    const result = await runtime.runOperation(
        'hr.leave.reject',
        authorization,
        { requestId: input.requestId, rejectedBy: input.rejectedBy },
        () => rejectLeaveRequest(runtime.dependencies, input),
    );

    const rejectionContext = runtime.coerceDecisionContext(result.decisionContext);

    await safelyDispatchNotification(
        () =>
            sendRejectionNotification(
                authorization,
                rejectionContext,
                input.reason,
                runtime.dependencies.hrNotificationService,
                runtime.logger,
            ),
        'Failed to send leave rejection notification',
        { orgId: authorization.orgId, requestId: result.requestId },
        runtime.logger,
    );

    return result;
}

export async function handleCancelLeaveRequest(
    runtime: LeaveServiceRuntime,
    input: CancelLeaveRequestInput,
): Promise<CancelLeaveRequestResult> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.CANCEL,
        resourceType: HR_RESOURCE.HR_LEAVE,
        resourceAttributes: { requestId: input.requestId, cancelledBy: input.cancelledBy },
    });
    const existingRequest = await runtime.dependencies.leaveRequestRepository.getLeaveRequest(
        authorization.tenantScope,
        input.requestId,
    );

    return runtime.runOperation(
        'hr.leave.cancel',
        authorization,
        { requestId: input.requestId, cancelledBy: input.cancelledBy },
        async () => {
            const result = await cancelLeaveRequest(runtime.dependencies, input);

            if (existingRequest) {
                await safelyDispatchNotification(
                    () =>
                        sendCancelNotification(
                            authorization,
                            {
                                userId: existingRequest.userId,
                                requestId: existingRequest.id,
                                leaveType: existingRequest.leaveType,
                                totalDays: existingRequest.totalDays,
                                startDate: existingRequest.startDate,
                                endDate: existingRequest.endDate,
                                reason: input.reason,
                            },
                            runtime.dependencies.hrNotificationService,
                            runtime.logger,
                        ),
                    'Failed to send leave cancellation notification',
                    { orgId: authorization.orgId, requestId: input.requestId },
                    runtime.logger,
                );
            }

            return result;
        },
    );
}

export async function handleListLeaveRequests(
    runtime: LeaveServiceRuntime,
    input: GetLeaveRequestsInput,
): Promise<GetLeaveRequestsResult> {
    const authorization = runtime.coerceAuthorization(input.authorization);
    await runtime.ensureOrgAccess(authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_LEAVE,
        resourceAttributes: { filters: input.filters },
    });
    return runtime.runOperation(
        'hr.leave.requests.list',
        authorization,
        input.filters ? { filters: serializeLeaveFilters(input.filters) } : undefined,
        () => getLeaveRequests(runtime.dependencies, input),
    );
}
