import type { RepositoryAuthorizationContext, TenantScopedRecord } from '@/server/repositories/security';
import {
  createEmployeeProfile,
  deleteEmployeeProfile,
  getEmployeeProfile,
  getEmployeeProfileByUser,
  listEmployeeProfiles,
  updateEmployeeProfile,
} from '@/server/services/hr/people/helpers/profile-handlers';
import type { PeopleServiceOperationRunner } from './people-service-runner';
import {
  emitProfileSideEffects,
  invalidateProfileCaches,
  unwrapOrThrow,
} from './people-service.operation-helpers';
import { registerProfilesCache } from '@/server/use-cases/hr/people/shared/cache-helpers';
import type {
  CreateEmployeeProfilePayload,
  CreateEmployeeProfileResult,
  DeleteEmployeeProfilePayload,
  DeleteEmployeeProfileResult,
  GetEmployeeProfileByUserPayload,
  GetEmployeeProfileByUserResult,
  GetEmployeeProfilePayload,
  GetEmployeeProfileResult,
  ListEmployeeProfilesPayload,
  ListEmployeeProfilesResult,
  PeopleServiceDependencies,
  PeopleServiceInput,
  PeopleServiceNotifications,
  UpdateEmployeeProfilePayload,
  UpdateEmployeeProfileResult,
} from './people-service.types';
import type { PeoplePlatformAdapters } from './people-service.adapters';
import type { EmployeeProfile } from '@/server/types/hr-types';

type EnsureEntityAccessFunction = <TRecord extends TenantScopedRecord>(
  authorization: RepositoryAuthorizationContext,
  record: TRecord | null | undefined,
) => TRecord;

type EnsureEntitiesAccessFunction = <TRecord extends TenantScopedRecord>(
  authorization: RepositoryAuthorizationContext,
  records: TRecord[],
) => TRecord[];

const sanitizeCorrelationId = (value: unknown): string | undefined =>
  (typeof value === 'string' && value.length > 0 ? value : undefined);

const registerProfileCaches = (
  authorization: RepositoryAuthorizationContext,
  profile?: EmployeeProfile,
): void => {
  registerProfilesCache(authorization, {
    classification: profile?.dataClassification,
    residency: profile?.dataResidency,
  });
};

export interface PeopleProfileOperationsContext {
  dependencies: PeopleServiceDependencies;
  notifications: PeopleServiceNotifications;
  runner: PeopleServiceOperationRunner;
  ensureEntityAccess: EnsureEntityAccessFunction;
  ensureEntitiesAccess: EnsureEntitiesAccessFunction;
  adapters: PeoplePlatformAdapters;
}

export function createPeopleProfileOperations(context: PeopleProfileOperationsContext) {
  const {
    dependencies,
    notifications,
    runner,
    ensureEntityAccess,
    ensureEntitiesAccess,
    adapters,
  } = context;

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

    async createEmployeeProfile(
      input: PeopleServiceInput<CreateEmployeeProfilePayload>,
    ): Promise<CreateEmployeeProfileResult> {
      const { profileData } = input.payload;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileWriteOperation(
        'hr.people.profiles.create',
        input.authorization,
        { targetUserId: profileData.userId, jobTitle: profileData.jobTitle },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<CreateEmployeeProfileResult> => {
          const creationResult: { profileId: string; profile?: EmployeeProfile } = unwrapOrThrow(
            await createEmployeeProfile({
              authorization,
              payload: profileData,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );
          const { profileId, profile } = creationResult;

          await invalidateProfileCaches(authorization, profile ?? undefined);
          if (profile) {
            const scopedProfile = ensureEntityAccess(authorization, profile);
            await emitProfileSideEffects({
              authorization,
              profile: scopedProfile,
              notifications,
              adapters,
              action: 'created',
              correlationId,
            });
            return { profileId: scopedProfile.id };
          }

          return { profileId };
        },
      );
    },

    async updateEmployeeProfile(
      input: PeopleServiceInput<UpdateEmployeeProfilePayload>,
    ): Promise<UpdateEmployeeProfileResult> {
      const { profileId, profileUpdates } = input.payload;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileWriteOperation(
        'hr.people.profiles.update',
        input.authorization,
        { profileId, updateKeys: Object.keys(profileUpdates) },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<UpdateEmployeeProfileResult> => {
          const updateResult: { profile: EmployeeProfile | null } = unwrapOrThrow(
            await updateEmployeeProfile({
              authorization,
              profileId,
              updates: profileUpdates,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );
          const { profile } = updateResult;

          if (!profile) {
            throw new Error('Employee profile not found after update.');
          }

          const scopedProfile = ensureEntityAccess(authorization, profile);
          const updatedFields = Object.keys(profileUpdates);

          await invalidateProfileCaches(authorization, scopedProfile);
          await notifications.profileUpdated(authorization.orgId, scopedProfile.id, scopedProfile, updatedFields);
          await emitProfileSideEffects({
            authorization,
            profile: scopedProfile,
            notifications,
            adapters,
            action: 'updated',
            updatedFields,
            correlationId,
          });

          return { profileId: scopedProfile.id };
        },
      );
    },

    async deleteEmployeeProfile(
      input: PeopleServiceInput<DeleteEmployeeProfilePayload>,
    ): Promise<DeleteEmployeeProfileResult> {
      const { profileId } = input.payload;
      const correlationId = sanitizeCorrelationId(input.correlationId);

      return runner.runProfileWriteOperation(
        'hr.people.profiles.delete',
        input.authorization,
        { profileId },
        correlationId,
        async (authorization: RepositoryAuthorizationContext): Promise<DeleteEmployeeProfileResult> => {
          const profileResult: { profile: EmployeeProfile | null } = unwrapOrThrow(
            await getEmployeeProfile({
              authorization,
              profileId,
              repositories: { profileRepo: dependencies.profileRepo },
            }),
          );
          const { profile } = profileResult;

          if (!profile) {
            throw new Error('Employee profile not found.');
          }

          const scopedProfile = ensureEntityAccess(authorization, profile);

          await deleteEmployeeProfile({
            authorization,
            profileId,
            repositories: { profileRepo: dependencies.profileRepo },
          });
          await invalidateProfileCaches(authorization, scopedProfile);
          await emitProfileSideEffects({
            authorization,
            profile: scopedProfile,
            notifications,
            adapters,
            action: 'deleted',
            correlationId,
          });

          return { success: true };
        },
      );
    },
  };
}
