/**
 * Shared helpers for leave request use-cases
 * Reduces code duplication and enforces consistent validation patterns
 */

import type { ILeaveRequestRepository } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { LeaveRequest, LeaveStatus } from '@/server/types/leave-types';
import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { TenantScope } from '@/server/types/tenant';

/**
 * Fetches and validates a leave request exists
 * @throws EntityNotFoundError if request not found
 */
export async function fetchLeaveRequest(
    repository: ILeaveRequestRepository,
    tenant: TenantScope,
    requestId: string,
): Promise<LeaveRequest> {
    const request = await repository.getLeaveRequest(tenant, requestId);

    if (!request) {
        throw new EntityNotFoundError('Leave request', { requestId });
    }

    return request;
}

/**
 * Validates a leave request has the expected status
 * @throws ValidationError if status doesn't match
 */
export function assertLeaveRequestStatus(
    request: LeaveRequest,
    expectedStatus: LeaveStatus,
    operation: string,
): void {
    if (request.status !== expectedStatus) {
        throw new ValidationError(
            `Cannot ${operation} leave request with status '${request.status}'.`,
            { requestId: request.id, currentStatus: request.status, expectedStatus },
        );
    }
}

/**
 * Validates a leave request is NOT in specified statuses
 * @throws ValidationError if status is in forbidden list
 */
export function assertLeaveRequestNotInStatus(
    request: LeaveRequest,
    forbiddenStatuses: LeaveStatus[],
    operation: string,
): void {
    if (forbiddenStatuses.includes(request.status)) {
        throw new ValidationError(
            `Cannot ${operation} leave request with status '${request.status}'.`,
            { requestId: request.id, currentStatus: request.status },
        );
    }
}

/**
 * Generates current ISO timestamp
 */
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

export interface LeaveDecisionContext {
    requestId: string;
    employeeId: string;
    userId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
}

export function buildLeaveDecisionContext(request: LeaveRequest): LeaveDecisionContext {
    return {
        requestId: request.id,
        employeeId: request.employeeId,
        userId: request.userId,
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        totalDays: request.totalDays,
    };
}
