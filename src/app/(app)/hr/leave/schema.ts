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

export const leaveRequestFormValuesSchema = z.object({
    leaveType: z
        .string()
        .trim()
        .min(2, { message: 'Select a leave type.' })
        .max(64, { message: 'Leave type must be 64 characters or less.' }),
    startDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Enter a valid start date.' }),
    endDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Enter a valid end date.' })
        .optional(),
    totalDays: z.coerce
        .number({ message: 'Enter a valid number of days.' })
        .positive({ message: 'Total days must be greater than 0.' })
        .max(365, { message: 'Total days must be 365 or less.' }),
    isHalfDay: z.preprocess(booleanFromFormValue, z.boolean()).optional(),
    reason: z
        .string()
        .trim()
        .max(2000, { message: 'Reason must be 2000 characters or less.' })
        .optional(),
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormValuesSchema>;
