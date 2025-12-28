import type { ILeaveRequestRepository, LeaveRequestReadOptions } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { registerLeaveCacheScopes } from './shared';

export interface GetLeaveRequestsDependencies {
    leaveRequestRepository: ILeaveRequestRepository;
}

export interface GetLeaveRequestsInput {
    authorization: RepositoryAuthorizationContext;
    employeeId?: string;
    filters?: {
        status?: LeaveRequest['status'];
        startDate?: Date;
        endDate?: Date;
    };
    options?: LeaveRequestReadOptions;
}

export interface GetLeaveRequestsResult {
    requests: LeaveRequest[];
    employeeId?: string;
    appliedFilters?: GetLeaveRequestsInput['filters'];
}

export async function getLeaveRequests(
    deps: GetLeaveRequestsDependencies,
    input: GetLeaveRequestsInput,
): Promise<GetLeaveRequestsResult> {
    registerLeaveCacheScopes(input.authorization, 'requests');

    let requests: LeaveRequest[];

    const filters = input.filters;

    if (input.employeeId) {
        assertNonEmpty(input.employeeId, 'Employee ID');
        requests = await deps.leaveRequestRepository.getLeaveRequestsByEmployee(
            input.authorization.tenantScope,
            input.employeeId,
            input.options,
        );

        // Apply client-side filtering if needed
        if (filters?.status) {
            requests = requests.filter((r) => r.status === filters.status);
        }
        if (filters?.startDate) {
            const startDate = filters.startDate;
            requests = requests.filter((r) => new Date(r.startDate) >= startDate);
        }
        if (filters?.endDate) {
            const endDate = filters.endDate;
            requests = requests.filter((r) => new Date(r.endDate) <= endDate);
        }
    } else {
        requests = await deps.leaveRequestRepository.getLeaveRequestsByOrganization(
            input.authorization.tenantScope,
            filters,
            input.options,
        );
    }

    return {
        requests,
        employeeId: input.employeeId,
        appliedFilters: filters,
    };
}
