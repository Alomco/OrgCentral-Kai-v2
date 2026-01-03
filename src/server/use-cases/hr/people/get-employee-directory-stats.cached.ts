import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import {
  getEmployeeDirectoryStats,
  type EmployeeDirectoryStats,
} from './get-employee-directory-stats';

export interface GetEmployeeDirectoryStatsForUiInput {
  authorization: RepositoryAuthorizationContext;
}

function resolveEmployeeProfileRepository(): IEmployeeProfileRepository {
  return new PrismaEmployeeProfileRepository();
}

export async function getEmployeeDirectoryStatsForUi(
  input: GetEmployeeDirectoryStatsForUiInput,
): Promise<EmployeeDirectoryStats> {
  async function getStatsCached(
    cachedInput: GetEmployeeDirectoryStatsForUiInput,
  ): Promise<EmployeeDirectoryStats> {
    'use cache';
    cacheLife('minutes');

    return getEmployeeDirectoryStats(
      { employeeProfileRepository: resolveEmployeeProfileRepository() },
      cachedInput,
    );
  }

  if (input.authorization.dataClassification !== 'OFFICIAL') {
    noStore();
    return getEmployeeDirectoryStats(
      { employeeProfileRepository: resolveEmployeeProfileRepository() },
      input,
    );
  }

  return getStatsCached({
    ...input,
    authorization: toCacheSafeAuthorizationContext(input.authorization),
  });
}
