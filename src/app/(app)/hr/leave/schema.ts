import { z } from 'zod';

function booleanFromFormValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'string') {
        return value === 'true';
    }

    return value;
}

export const leaveRequestFormValuesSchema = z.object({
    leaveType: z.string().trim().min(2).max(64),
    startDate: z.string().trim().min(10).max(10),
    endDate: z.string().trim().min(10).max(10).optional(),
    totalDays: z.coerce.number().positive().max(365),
    isHalfDay: z.preprocess(booleanFromFormValue, z.boolean()).optional(),
    reason: z.string().trim().max(2000).optional(),
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormValuesSchema>;
