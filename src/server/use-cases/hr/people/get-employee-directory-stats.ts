import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { PeopleListFilters } from '@/server/types/hr/people';
import { registerProfilesCache } from './shared/cache-helpers';
import { normalizeProfileFilters } from './shared/profile-validators';
import { assertPeopleProfileReader } from '@/server/security/guards-hr-people';
import { HR_ACTION } from '@/server/security/authorization/hr-resource-registry';

export interface EmployeeDirectoryStats {
  total: number;
  active: number;
  onLeave: number;
  newThisMonth: number;
}

export interface GetEmployeeDirectoryStatsInput {
  authorization: RepositoryAuthorizationContext;
}

export interface GetEmployeeDirectoryStatsDependencies {
  employeeProfileRepository: IEmployeeProfileRepository;
}

export async function getEmployeeDirectoryStats(
  dependencies: GetEmployeeDirectoryStatsDependencies,
  input: GetEmployeeDirectoryStatsInput,
): Promise<EmployeeDirectoryStats> {
  await assertPeopleProfileReader({
    authorization: input.authorization,
    action: HR_ACTION.READ,
    resourceAttributes: {
      orgId: input.authorization.orgId,
      summary: true,
    },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const toFilters = (filters: PeopleListFilters) =>
    normalizeProfileFilters(filters) ?? filters;

  const [total, active, onLeave, newThisMonth] = await Promise.all([
    dependencies.employeeProfileRepository.countEmployeeProfilesByOrganization(
      input.authorization.orgId,
      undefined,
    ),
    dependencies.employeeProfileRepository.countEmployeeProfilesByOrganization(
      input.authorization.orgId,
      toFilters({ employmentStatus: 'ACTIVE' }),
    ),
    dependencies.employeeProfileRepository.countEmployeeProfilesByOrganization(
      input.authorization.orgId,
      toFilters({ employmentStatus: 'ON_LEAVE' }),
    ),
    dependencies.employeeProfileRepository.countEmployeeProfilesByOrganization(
      input.authorization.orgId,
      toFilters({ startDate: monthStart.toISOString() }),
    ),
  ]);

  registerProfilesCache(input.authorization);

  return { total, active, onLeave, newThisMonth };
}
