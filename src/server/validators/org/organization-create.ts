import { z } from 'zod';

import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from '@/server/types/tenant';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export const organizationCreateSchema = z
    .object({
        slug: z
            .string()
            .trim()
            .min(2)
            .max(120)
            .regex(slugPattern, 'Slug may contain letters, numbers, and hyphens only.'),
        name: z.string().trim().min(1).max(120),
        regionCode: z.string().trim().min(2).max(12),
        dataResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
        dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
    })
    .strict();

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
