import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { registerProfilesCache } from '@/server/use-cases/hr/people/shared/cache-helpers';

export const sanitizeCorrelationId = (value: unknown): string | undefined =>
  (typeof value === 'string' && value.length > 0 ? value : undefined);

export const registerProfileCaches = (
  authorization: RepositoryAuthorizationContext,
  profile?: EmployeeProfile,
): void => {
  registerProfilesCache(authorization, {
    classification: profile?.dataClassification,
    residency: profile?.dataResidency,
  });
};
