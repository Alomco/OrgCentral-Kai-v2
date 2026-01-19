import type { RepositoryAuthorizationDefaults } from '@/server/repositories/security';
import { HR_ACTION, HR_RESOURCE_TYPE } from '@/server/security/authorization/hr-permissions';

/**
 * Helper to create RepositoryAuthorizer defaults for HR People flows
 * Standardizes expected classification and residency for all people operations
 */

const DEFAULT_CLASSIFICATION = 'OFFICIAL';
const DEFAULT_RESIDENCY = 'UK_ONLY';

export function createHrPeopleAuthorizationDefaults(
  overrides?: Partial<RepositoryAuthorizationDefaults>
): RepositoryAuthorizationDefaults {
  return {
    expectedClassification: DEFAULT_CLASSIFICATION,
    expectedResidency: DEFAULT_RESIDENCY,
    auditSource: 'hr:people',
    requiredPermissions: { [HR_RESOURCE_TYPE.ORG_SETTINGS]: [HR_ACTION.READ] },
    ...overrides,
  };
}

export function createHrPeopleEditorRepositoryDefaults(
  overrides?: Partial<RepositoryAuthorizationDefaults>
): RepositoryAuthorizationDefaults {
  return createHrPeopleAuthorizationDefaults({
    auditSource: 'hr:people:edit',
    requiredPermissions: {
      [HR_RESOURCE_TYPE.EMPLOYEE_PROFILE]: [HR_ACTION.UPDATE],
      [HR_RESOURCE_TYPE.EMPLOYMENT_CONTRACT]: [HR_ACTION.UPDATE],
    },
    ...overrides,
  });
}

export function createHrPeopleProfileRepositoryDefaults(
  overrides?: Partial<RepositoryAuthorizationDefaults>
): RepositoryAuthorizationDefaults {
  return createHrPeopleAuthorizationDefaults({
    auditSource: 'hr:people:profiles',
    ...overrides,
  });
}

export function createHrPeopleContractRepositoryDefaults(
  overrides?: Partial<RepositoryAuthorizationDefaults>
): RepositoryAuthorizationDefaults {
  return createHrPeopleAuthorizationDefaults({
    auditSource: 'hr:people:contracts',
    ...overrides,
  });
}
