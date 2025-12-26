import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import { getLeaveService } from '@/server/services/hr/leave/leave-service.provider';

export interface GetLeaveRequestsForUiInput {
    authorization: RepositoryAuthorizationContext;
    employeeId?: string;
}

export interface GetLeaveRequestsForUiResult {
    requests: LeaveRequest[];
}

export async function getLeaveRequestsForUi(
    input: GetLeaveRequestsForUiInput,
): Promise<GetLeaveRequestsForUiResult> {
    async function getLeaveRequestsCached(
        cachedInput: GetLeaveRequestsForUiInput,
    ): Promise<GetLeaveRequestsForUiResult> {
        'use cache';
        cacheLife('minutes');

        const service = getLeaveService();
        const result = await service.listLeaveRequests({
            authorization: cachedInput.authorization,
            employeeId: cachedInput.employeeId,
        });

        return { requests: result.requests };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const service = getLeaveService();
        const result = await service.listLeaveRequests({
            authorization: input.authorization,
            employeeId: input.employeeId,
        });

        return { requests: result.requests };
    }

    return getLeaveRequestsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
