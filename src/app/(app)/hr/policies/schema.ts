import { z } from 'zod';

export const acknowledgePolicyFormValuesSchema = z.object({
    policyId: z.string().trim().min(1),
    version: z.string().trim().min(1),
});

export type AcknowledgePolicyFormValues = z.infer<typeof acknowledgePolicyFormValuesSchema>;
