import { z } from 'zod';

export const reportAbsenceSchema = z.object({
    typeId: z.string().min(1, 'Type is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    hours: z.coerce.number().min(0.5, 'Hours must be at least 0.5').max(24, 'Hours cannot exceed 24'),
    reason: z.string().optional(),
});

export type ReportAbsenceFormValues = z.infer<typeof reportAbsenceSchema>;

/** Schema for cancelling an absence. */
export const cancelAbsenceSchema = z.object({
    reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export type CancelAbsenceFormValues = z.infer<typeof cancelAbsenceSchema>;

