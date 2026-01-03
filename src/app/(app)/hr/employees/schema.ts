import { z } from 'zod';

import {
    CONTRACT_TYPE_VALUES,
    EMPLOYMENT_STATUS_VALUES,
    EMPLOYMENT_TYPE_VALUES,
    PAY_SCHEDULE_VALUES,
    SALARY_BASIS_VALUES,
    SALARY_FREQUENCY_VALUES,
} from '@/server/types/hr/people';

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = (max: number) => z.string().trim().max(max);
const optionalEmail = z.email().trim().max(200).or(z.literal(''));
const optionalDateInput = z.string().regex(DATE_INPUT_PATTERN).or(z.literal(''));
const requiredDateInput = z.string().regex(DATE_INPUT_PATTERN, 'Use YYYY-MM-DD');
const optionalNumberInput = z
    .string()
    .trim()
    .max(40)
    .refine((value) => value.length === 0 || !Number.isNaN(Number(value)), {
        message: 'Enter a valid number.',
    });
const optionalEnum = <TValues extends readonly [string, ...string[]]>(values: TValues) =>
    z.enum(values).or(z.literal(''));

export const employeeProfileFormSchema = z.object({
    profileId: z.uuid(),
    displayName: optionalText(120),
    firstName: optionalText(80),
    lastName: optionalText(80),
    email: optionalEmail,
    personalEmail: optionalEmail,
    phoneWork: optionalText(40),
    phoneMobile: optionalText(40),
    phoneHome: optionalText(40),
    jobTitle: optionalText(120),
    departmentId: optionalText(120),
    costCenter: optionalText(80),
    managerUserId: optionalText(80),
    employmentType: z.enum(EMPLOYMENT_TYPE_VALUES),
    employmentStatus: z.enum(EMPLOYMENT_STATUS_VALUES),
    startDate: optionalDateInput,
    endDate: optionalDateInput,
    addressStreet: optionalText(140),
    addressCity: optionalText(100),
    addressState: optionalText(100),
    addressPostalCode: optionalText(40),
    addressCountry: optionalText(80),
    emergencyContactName: optionalText(120),
    emergencyContactRelationship: optionalText(120),
    emergencyContactPhone: optionalText(40),
    emergencyContactEmail: optionalEmail,
    annualSalary: optionalNumberInput,
    hourlyRate: optionalNumberInput,
    salaryAmount: optionalNumberInput,
    salaryCurrency: optionalText(10),
    salaryFrequency: optionalEnum(SALARY_FREQUENCY_VALUES),
    salaryBasis: optionalEnum(SALARY_BASIS_VALUES),
    paySchedule: optionalEnum(PAY_SCHEDULE_VALUES),
    metadata: optionalText(5000),
});

export type EmployeeProfileFormValues = z.infer<typeof employeeProfileFormSchema>;

export const employeeContractFormSchema = z.object({
    profileId: z.uuid(),
    userId: z.uuid(),
    contractId: z.uuid().or(z.literal('')),
    contractType: z.enum(CONTRACT_TYPE_VALUES),
    jobTitle: z.string().trim().min(1, 'Job title is required').max(120),
    departmentId: optionalText(120),
    location: optionalText(120),
    startDate: requiredDateInput,
    endDate: optionalDateInput,
    probationEndDate: optionalDateInput,
    terminationReason: optionalText(200),
    furloughStartDate: optionalDateInput,
    furloughEndDate: optionalDateInput,
    workingPattern: optionalText(5000),
    benefits: optionalText(5000),
    terminationNotes: optionalText(500),
});

export type EmployeeContractFormValues = z.infer<typeof employeeContractFormSchema>;
