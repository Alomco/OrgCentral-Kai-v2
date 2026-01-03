import {
    HR_RESOURCE_TYPE,
    HR_ACTION,
    type HrResourceType,
    type HrAction,
    isHrResourceType as checkIsHrResourceType,
    isHrAction as checkIsHrAction,
} from './hr-permissions';

export const HR_RESOURCE = {
    TIME_ENTRY: HR_RESOURCE_TYPE.TIME_ENTRY,
    HR_SETTINGS: HR_RESOURCE_TYPE.HR_SETTINGS,
    HR_POLICY: HR_RESOURCE_TYPE.POLICY,
    HR_LEAVE_POLICY: HR_RESOURCE_TYPE.LEAVE_POLICY,
    HR_LEAVE: HR_RESOURCE_TYPE.LEAVE_REQUEST,
    HR_LEAVE_BALANCE: HR_RESOURCE_TYPE.LEAVE_BALANCE,
    HR_ABSENCE: HR_RESOURCE_TYPE.ABSENCE,
    HR_ABSENCE_SETTINGS: HR_RESOURCE_TYPE.ABSENCE_SETTINGS,
    HR_ABSENCE_AI_VALIDATION: 'hr.absence-ai-validation', // Legacy
    HR_ONBOARDING: HR_RESOURCE_TYPE.ONBOARDING_INVITE,
    HR_EMPLOYEE_PROFILE: HR_RESOURCE_TYPE.EMPLOYEE_PROFILE,
    HR_EMPLOYMENT_CONTRACT: HR_RESOURCE_TYPE.EMPLOYMENT_CONTRACT,
    HR_CHECKLIST_TEMPLATE: HR_RESOURCE_TYPE.CHECKLIST_TEMPLATE,
    HR_TRAINING: HR_RESOURCE_TYPE.TRAINING_RECORD,
    HR_NOTIFICATION: HR_RESOURCE_TYPE.NOTIFICATION,
    HR_COMPLIANCE: HR_RESOURCE_TYPE.COMPLIANCE_ITEM,
    HR_PERFORMANCE: HR_RESOURCE_TYPE.PERFORMANCE_REVIEW,
} as const;

export type HrResourceTypeLegacy = (typeof HR_RESOURCE)[keyof typeof HR_RESOURCE];

// Re-export HR_ACTION for consistency
export { HR_ACTION, type HrAction };

export function isHrResourceType(value: string): value is HrResourceType {
    return checkIsHrResourceType(value);
}

export function isHrAction(value: string): value is HrAction {
    return checkIsHrAction(value);
}

// Re-export new types for migration
export { HR_RESOURCE_TYPE, type HrResourceType };

