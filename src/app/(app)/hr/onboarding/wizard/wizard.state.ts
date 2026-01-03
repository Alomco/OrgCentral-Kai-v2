import type { OnboardingWizardValues } from './wizard.schema';
import type { FieldErrors } from '../../_components/form-errors';

export type OnboardingWizardStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

export interface OnboardingWizardState {
    status: OnboardingWizardStatus;
    currentStep: number;
    message?: string;
    token?: string;
    fieldErrors?: FieldErrors<OnboardingWizardValues>;
    values: OnboardingWizardValues;
    /** Email collision check result */
    emailCheckResult?: {
        exists: boolean;
        reason?: string;
    };
}

export function buildInitialWizardState(
    values?: Partial<OnboardingWizardValues>,
): OnboardingWizardState {
    return {
        status: 'idle',
        currentStep: 0,
        values: {
            email: values?.email ?? '',
            displayName: values?.displayName ?? '',
            employeeNumber: values?.employeeNumber ?? '',
            jobTitle: values?.jobTitle,
            departmentId: values?.departmentId,
            employmentType: values?.employmentType,
            startDate: values?.startDate,
            annualSalary: values?.annualSalary,
            currency: values?.currency ?? 'GBP',
            paySchedule: values?.paySchedule ?? 'MONTHLY',
            managerEmployeeNumber: values?.managerEmployeeNumber,
            eligibleLeaveTypes: values?.eligibleLeaveTypes ?? [],
            onboardingTemplateId: values?.onboardingTemplateId,
            includeTemplate: values?.includeTemplate ?? false,
        },
    };
}

export function mergeWizardValues(
    current: OnboardingWizardValues,
    updates: Partial<OnboardingWizardValues>,
): OnboardingWizardValues {
    return {
        ...current,
        ...updates,
    };
}
