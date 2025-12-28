import type { ILeaveRequestRepository, LeaveRequestReadOptions } from '@/server/repositories/contracts/hr/leave/leave-request-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import { assertNonEmpty } from '@/server/use-cases/shared';
import { registerLeaveCacheScopes } from './shared/cache-helpers';

export interface GetLeaveRequestDependencies {
    leaveRequestRepository: ILeaveRequestRepository;
}

export interface GetLeaveRequestInput {
    authorization: RepositoryAuthorizationContext;
    requestId: string;
    options?: LeaveRequestReadOptions;
}

export interface GetLeaveRequestResult {
    request: LeaveRequest | null;
    requestId: string;
}

export async function getLeaveRequest(
    deps: GetLeaveRequestDependencies,
    input: GetLeaveRequestInput,
): Promise<GetLeaveRequestResult> {
    assertNonEmpty(input.requestId, 'Request ID');
    registerLeaveCacheScopes(input.authorization, 'requests');

    const request = await deps.leaveRequestRepository.getLeaveRequest(
        input.authorization.tenantScope,
        input.requestId,
        input.options,
    );

    return {
        request,
        requestId: input.requestId,
    };
}
