import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PeopleListFilters } from '@/server/types/hr/people';
import type {
  EmployeeProfileSortInput,
} from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';

import { listEmployeeDirectory } from './list-employee-directory';

export interface ListEmployeeDirectoryForUiInput {
  authorization: RepositoryAuthorizationContext;
  page: number;
  pageSize: number;
  sort?: EmployeeProfileSortInput;
  filters?: PeopleListFilters;
}

export interface ListEmployeeDirectoryForUiResult {
  profiles: Awaited<ReturnType<typeof listEmployeeDirectory>>['profiles'];
  totalCount: number;
  page: number;
  pageSize: number;
}

function resolveEmployeeProfileRepository(): IEmployeeProfileRepository {
  return new PrismaEmployeeProfileRepository();
}

export async function listEmployeeDirectoryForUi(
  input: ListEmployeeDirectoryForUiInput,
): Promise<ListEmployeeDirectoryForUiResult> {
  async function listDirectoryCached(
    cachedInput: ListEmployeeDirectoryForUiInput,
  ): Promise<ListEmployeeDirectoryForUiResult> {
    'use cache';
    cacheLife('minutes');

    return listEmployeeDirectory(
      { employeeProfileRepository: resolveEmployeeProfileRepository() },
      cachedInput,
    );
  }

  if (input.authorization.dataClassification !== 'OFFICIAL') {
    noStore();
    return listEmployeeDirectory(
      { employeeProfileRepository: resolveEmployeeProfileRepository() },
      input,
    );
  }

  return listDirectoryCached({
    ...input,
    authorization: toCacheSafeAuthorizationContext(input.authorization),
  });
}
