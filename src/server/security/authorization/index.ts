export * from './abac-context';
export * from './engine';
export * from './rbac';
export * from './session-access';

// Legacy domain-specific authorization modules (for backwards compatibility)
// These export names that may conflict with hr-guards, so import selectively
export {
    canManageOrgAbsences,
    assertActorOrPrivileged,
    assertPrivilegedOrgAbsenceActor,
    assertValidDateRange,
} from './absences';

export {
    canManageOrgPolicies,
    assertPrivilegedOrgPolicyActor,
    assertPolicyAcknowledgmentActor,
} from './hr-policies';

export {
    canManageOrgTimeEntries,
    assertPrivilegedOrgTimeEntryActor,
    assertValidTimeWindow,
} from './time-tracking';

export {
    canManageOrgTraining,
    assertValidTrainingDates,
} from './training';

// New centralized HR permission system (split modules)
export * from './hr-permissions/index';
export * from './hr-permission-types';
export * from './hr-guards/index';
export * from './permission-check/index';

// Legacy resource registry (re-exports hr-permissions with backwards-compat names)
export { HR_RESOURCE, type HrResourceTypeLegacy } from './hr-resource-registry';



