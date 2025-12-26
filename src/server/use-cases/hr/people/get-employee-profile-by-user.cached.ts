import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';

import { getEmployeeProfileByUser } from './get-employee-profile-by-user';

export interface GetEmployeeProfileByUserForUiInput {
    authorization: RepositoryAuthorizationContext;
    userId: string;
}

export interface GetEmployeeProfileByUserForUiResult {
    profile: EmployeeProfile | null;
}

function resolveEmployeeProfileRepository(): IEmployeeProfileRepository {
    return new PrismaEmployeeProfileRepository();
}

export async function getEmployeeProfileByUserForUi(
    input: GetEmployeeProfileByUserForUiInput,
): Promise<GetEmployeeProfileByUserForUiResult> {
    async function getProfileCached(
        cachedInput: GetEmployeeProfileByUserForUiInput,
    ): Promise<GetEmployeeProfileByUserForUiResult> {
        'use cache';
        cacheLife('minutes');

        return getEmployeeProfileByUser(
            { employeeProfileRepository: resolveEmployeeProfileRepository() },
            { authorization: cachedInput.authorization, userId: cachedInput.userId },
        );
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return getEmployeeProfileByUser(
            { employeeProfileRepository: resolveEmployeeProfileRepository() },
            { authorization: input.authorization, userId: input.userId },
        );
    }

    return getProfileCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
