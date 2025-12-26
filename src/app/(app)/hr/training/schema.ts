import { z } from 'zod';

export const enrollTrainingSchema = z.object({
    courseName: z.string().min(1, 'Course name is required'),
    provider: z.string().min(1, 'Provider is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    expiryDate: z.string().optional(),
    cost: z.coerce.number().min(0, 'Cost must be positive').optional(),
});

export type EnrollTrainingFormValues = z.infer<typeof enrollTrainingSchema>;
