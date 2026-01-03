import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
  EmployeeProfilePagedQuery,
  EmployeeProfileSortInput,
  IEmployeeProfileRepository,
} from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { EmployeeProfile } from '@/server/types/hr-types';
import type { PeopleListFilters } from '@/server/types/hr/people';
import { registerProfilesCache } from './shared/cache-helpers';
import { normalizeProfileFilters } from './shared/profile-validators';
import { assertPeopleProfileReader } from '@/server/security/guards-hr-people';
import { HR_ACTION } from '@/server/security/authorization/hr-resource-registry';

export interface ListEmployeeDirectoryInput {
  authorization: RepositoryAuthorizationContext;
  page: number;
  pageSize: number;
  sort?: EmployeeProfileSortInput;
  filters?: PeopleListFilters;
}

export interface ListEmployeeDirectoryResult {
  profiles: EmployeeProfile[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ListEmployeeDirectoryDependencies {
  employeeProfileRepository: IEmployeeProfileRepository;
}

const DEFAULT_SORT: EmployeeProfileSortInput = { key: 'name', direction: 'asc' };

export async function listEmployeeDirectory(
  dependencies: ListEmployeeDirectoryDependencies,
  input: ListEmployeeDirectoryInput,
): Promise<ListEmployeeDirectoryResult> {
  const normalizedFilters = normalizeProfileFilters(input.filters);

  await assertPeopleProfileReader({
    authorization: input.authorization,
    action: HR_ACTION.READ,
    resourceAttributes: {
      orgId: input.authorization.orgId,
      filterCount: Object.keys(normalizedFilters ?? {}).length,
      filters: normalizedFilters,
    },
  });

  const totalCount = await dependencies.employeeProfileRepository.countEmployeeProfilesByOrganization(
    input.authorization.orgId,
    normalizedFilters,
  );

  const safePageSize = Math.max(1, Math.floor(input.pageSize));
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(input.page)), totalPages);

  const query: EmployeeProfilePagedQuery = {
    page: safePage,
    pageSize: safePageSize,
    filters: normalizedFilters,
    sort: input.sort ?? DEFAULT_SORT,
  };

  const profiles = await dependencies.employeeProfileRepository.getEmployeeProfilesByOrganizationPaged(
    input.authorization.orgId,
    query,
  );

  registerProfilesCache(input.authorization);

  return {
    profiles: profiles.map((profile) => ({
      ...profile,
      dataResidency: profile.dataResidency ?? input.authorization.dataResidency,
      dataClassification: profile.dataClassification ?? input.authorization.dataClassification,
    })),
    totalCount,
    page: safePage,
    pageSize: safePageSize,
  };
}
