import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
  countEmployeeProfiles,
  getEmployeeProfile,
  getEmployeeProfileByUser,
  listEmployeeProfiles,
} from '@/server/services/hr/people/helpers/profile-handlers';
import { unwrapOrThrow } from './people-service.operation-helpers';
import type {
  CountEmployeeProfilesPayload,
  CountEmployeeProfilesResult,
  GetEmployeeProfileByUserPayload,
  GetEmployeeProfileByUserResult,
  GetEmployeeProfilePayload,
  GetEmployeeProfileResult,
  ListEmployeeProfilesPayload,
  ListEmployeeProfilesResult,
  PeopleServiceInput,
} from './people-service.types';
import type { EmployeeProfile } from '@/server/types/hr-types';
import type { PeopleProfileOperationsContext } from './people-service.profile-operations.types';
import { registerProfileCaches, sanitizeCorrelationId } from './people-service.profile-operations.helpers';

export function createPeopleProfileReadOperations(context: PeopleProfileOperationsContext) {
  const { dependencies, runner, ensureEntityAccess, ensureEntitiesAccess } = context;

  return {
    async getEmployeeProfile(
      input: PeopleServiceInput<GetEmployeeProfilePayload>,
    ): Promise<GetEmployeeProfileResult> {
      const { profileId } = input.payload;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileReadOperation(
        'hr.people.profiles.get',
        input.authorization,
        { profileId },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<GetEmployeeProfileResult> => {
          const profileResult: { profile: EmployeeProfile | null } = unwrapOrThrow(
            await getEmployeeProfile({
              authorization,
              profileId,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );
          const { profile } = profileResult;

          return { profile: profile ? ensureEntityAccess(authorization, profile) : null };
        },
      );
    },

    async getEmployeeProfileByUser(
      input: PeopleServiceInput<GetEmployeeProfileByUserPayload>,
    ): Promise<GetEmployeeProfileByUserResult> {
      const { userId } = input.payload;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileReadOperation(
        'hr.people.profiles.getByUser',
        input.authorization,
        { targetUserId: userId },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<GetEmployeeProfileByUserResult> => {
          const profileResult: { profile: EmployeeProfile | null } = unwrapOrThrow(
            await getEmployeeProfileByUser({
              authorization,
              userId,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );
          const { profile } = profileResult;

          if (!profile) {
            return { profile: null };
          }

          const scopedProfile = ensureEntityAccess(authorization, profile);
          registerProfileCaches(authorization, scopedProfile);
          return { profile: scopedProfile };
        },
      );
    },

    async listEmployeeProfiles(
      input: PeopleServiceInput<ListEmployeeProfilesPayload>,
    ): Promise<ListEmployeeProfilesResult> {
      const filters = input.payload.filters;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileReadOperation(
        'hr.people.profiles.list',
        input.authorization,
        { filterCount: Object.keys(filters ?? {}).length, filters },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<ListEmployeeProfilesResult> => {
          const listResult: { profiles: EmployeeProfile[] } = unwrapOrThrow(
            await listEmployeeProfiles({
              authorization,
              filters,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );
          const { profiles } = listResult;

          const scopedProfiles = ensureEntitiesAccess(authorization, profiles);
          scopedProfiles.forEach((profile) => registerProfileCaches(authorization, profile));
          return { profiles: scopedProfiles };
        },
      );
    },

    async countEmployeeProfiles(
      input: PeopleServiceInput<CountEmployeeProfilesPayload>,
    ): Promise<CountEmployeeProfilesResult> {
      const filters = input.payload.filters;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileReadOperation(
        'hr.people.profiles.count',
        input.authorization,
        { filterCount: Object.keys(filters ?? {}).length, filters },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<CountEmployeeProfilesResult> => {
          const countResult: { count: number } = unwrapOrThrow(
            await countEmployeeProfiles({
              authorization,
              filters,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );

          return countResult;
        },
      );
    },
  };
}
