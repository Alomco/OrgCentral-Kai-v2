import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import type { PeopleListFilters } from '@/server/types/hr/people';

import { listEmployeeProfiles } from './list-employee-profiles';

export interface ListEmployeeProfilesForUiInput {
    authorization: RepositoryAuthorizationContext;
    filters?: PeopleListFilters;
}

export interface ListEmployeeProfilesForUiResult {
    profiles: EmployeeProfile[];
}

function resolveEmployeeProfileRepository(): IEmployeeProfileRepository {
    return new PrismaEmployeeProfileRepository();
}

export async function listEmployeeProfilesForUi(
    input: ListEmployeeProfilesForUiInput,
): Promise<ListEmployeeProfilesForUiResult> {
    async function listProfilesCached(
        cachedInput: ListEmployeeProfilesForUiInput,
    ): Promise<ListEmployeeProfilesForUiResult> {
        'use cache';
        cacheLife('minutes');

        return listEmployeeProfiles(
            { employeeProfileRepository: resolveEmployeeProfileRepository() },
            { authorization: cachedInput.authorization, filters: cachedInput.filters },
        );
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return listEmployeeProfiles(
            { employeeProfileRepository: resolveEmployeeProfileRepository() },
            { authorization: input.authorization, filters: input.filters },
        );
    }

    return listProfilesCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
