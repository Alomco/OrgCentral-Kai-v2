import { z } from 'zod';

function booleanFromFormValue(value: unknown): boolean | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'on') {
            return true;
        }
        if (normalized === 'false' || normalized === '0' || normalized === 'off') {
            return false;
        }
        return undefined;
    }
    return undefined;
}

/**
 * Step 1: Identity - Basic employee information
 */
export const onboardingIdentityStepSchema = z.object({
    email: z.email({ message: 'Enter a valid email address' }).min(3, 'Email is required'),
    displayName: z.string().trim().min(1, 'Display name is required').max(120, 'Display name is too long'),
    employeeNumber: z.string().trim().min(1, 'Employee number is required').max(64, 'Employee number is too long'),
});

export type OnboardingIdentityStepValues = z.infer<typeof onboardingIdentityStepSchema>;

/**
 * Step 2: Job & Compensation - Employment details
 */
export const onboardingJobStepSchema = z.object({
    jobTitle: z.string().trim().max(120, 'Job title is too long').optional(),
    departmentId: z.uuid().optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERN']).optional(),
    startDate: z
        .string()
        .optional()
        .refine(
            (value) => {
                if (!value || value.trim() === '') {return true;}
                const date = new Date(value);
                return !Number.isNaN(date.getTime());
            },
            { message: 'Enter a valid date' },
        ),
    annualSalary: z.coerce.number().min(0, 'Salary must be positive').optional(),
    currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
    paySchedule: z.enum(['MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL']).optional(),
    managerEmployeeNumber: z.string().trim().max(64).optional(),
});

export type OnboardingJobStepValues = z.infer<typeof onboardingJobStepSchema>;

/**
 * Step 3: Assignments - Leave types and checklist templates
 */
export const onboardingAssignmentsStepSchema = z.object({
    eligibleLeaveTypes: z.array(z.string().trim().min(1)).max(20).optional(),
    onboardingTemplateId: z.uuid().optional(),
    includeTemplate: z.preprocess(booleanFromFormValue, z.boolean()).optional(),
});

export type OnboardingAssignmentsStepValues = z.infer<typeof onboardingAssignmentsStepSchema>;

/**
 * Combined wizard schema for all steps
 */
export const onboardingWizardSchema = z.object({
    // Step 1: Identity
    email: onboardingIdentityStepSchema.shape.email,
    displayName: onboardingIdentityStepSchema.shape.displayName,
    employeeNumber: onboardingIdentityStepSchema.shape.employeeNumber,
    // Step 2: Job & Compensation
    jobTitle: onboardingJobStepSchema.shape.jobTitle,
    departmentId: onboardingJobStepSchema.shape.departmentId,
    employmentType: onboardingJobStepSchema.shape.employmentType,
    startDate: onboardingJobStepSchema.shape.startDate,
    annualSalary: onboardingJobStepSchema.shape.annualSalary,
    currency: onboardingJobStepSchema.shape.currency,
    paySchedule: onboardingJobStepSchema.shape.paySchedule,
    managerEmployeeNumber: onboardingJobStepSchema.shape.managerEmployeeNumber,
    // Step 3: Assignments
    eligibleLeaveTypes: onboardingAssignmentsStepSchema.shape.eligibleLeaveTypes,
    onboardingTemplateId: onboardingAssignmentsStepSchema.shape.onboardingTemplateId,
    includeTemplate: onboardingAssignmentsStepSchema.shape.includeTemplate,
});

export type OnboardingWizardValues = z.infer<typeof onboardingWizardSchema>;

/**
 * Validate a specific step of the wizard
 */
export function validateWizardStep(
    step: number,
    values: Partial<OnboardingWizardValues>,
) {
    switch (step) {
        case 0:
            return onboardingIdentityStepSchema.safeParse(values);
        case 1:
            return onboardingJobStepSchema.safeParse(values);
        case 2:
            return onboardingAssignmentsStepSchema.safeParse(values);
        case 3:
            // Review step validates the full form
            return onboardingWizardSchema.safeParse(values);
        default:
            return onboardingWizardSchema.safeParse(values);
    }
}

/**
 * Default values for a new onboarding wizard
 */
export const defaultOnboardingWizardValues: OnboardingWizardValues = {
    email: '',
    displayName: '',
    employeeNumber: '',
    jobTitle: undefined,
    departmentId: undefined,
    employmentType: undefined,
    startDate: undefined,
    annualSalary: undefined,
    currency: 'GBP',
    paySchedule: 'MONTHLY',
    managerEmployeeNumber: undefined,
    eligibleLeaveTypes: [],
    onboardingTemplateId: undefined,
    includeTemplate: false,
};
