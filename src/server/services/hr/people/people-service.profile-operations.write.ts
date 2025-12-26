import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
  createEmployeeProfile,
  deleteEmployeeProfile,
  getEmployeeProfile,
  updateEmployeeProfile,
} from '@/server/services/hr/people/helpers/profile-handlers';
import {
  emitProfileSideEffects,
  invalidateProfileCaches,
  unwrapOrThrow,
} from './people-service.operation-helpers';
import type {
  CreateEmployeeProfilePayload,
  CreateEmployeeProfileResult,
  DeleteEmployeeProfilePayload,
  DeleteEmployeeProfileResult,
  PeopleServiceInput,
  UpdateEmployeeProfilePayload,
  UpdateEmployeeProfileResult,
} from './people-service.types';
import type { EmployeeProfile } from '@/server/types/hr-types';
import type { PeopleProfileOperationsContext } from './people-service.profile-operations.types';
import { sanitizeCorrelationId } from './people-service.profile-operations.helpers';

export function createPeopleProfileWriteOperations(context: PeopleProfileOperationsContext) {
  const {
    dependencies,
    notifications,
    runner,
    ensureEntityAccess,
    adapters,
  } = context;

  return {
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
