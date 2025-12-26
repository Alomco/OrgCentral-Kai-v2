import { z } from 'zod';

export const createTimeEntrySchema = z.object({
    date: z.string().min(1, 'Date is required'),
    clockIn: z.string().min(1, 'Clock in time is required'),
    clockOut: z.string().optional(),
    breakDuration: z.coerce.number().min(0, 'Break duration must be positive').optional(),
    project: z.string().optional(),
    notes: z.string().optional(),
});

export type CreateTimeEntryFormValues = z.infer<typeof createTimeEntrySchema>;
