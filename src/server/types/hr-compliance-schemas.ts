import { z } from 'zod';
import { COMPLIANCE_ITEM_STATUSES } from '@/server/types/compliance-types';

const complianceStatusValues = [...COMPLIANCE_ITEM_STATUSES] as [
    (typeof COMPLIANCE_ITEM_STATUSES)[number],
    ...(typeof COMPLIANCE_ITEM_STATUSES)[number][],
];

export const assignComplianceItemsSchema = z.object({
    userIds: z.array(z.uuid()).min(1),
    templateId: z.uuid(),
    templateItemIds: z.array(z.string().min(1)).min(1),
});

export type AssignComplianceItemsPayload = z.infer<typeof assignComplianceItemsSchema>;

export const updateComplianceItemSchema = z.object({
    userId: z.uuid(),
    itemId: z.string().min(1),
    updates: z
        .object({
            status: z.enum(complianceStatusValues).optional(),
            notes: z.string().max(4000).nullable().optional(),
            attachments: z.array(z.string().min(1)).max(10).nullable().optional(),
            completedAt: z.coerce.date().nullable().optional(),
            dueDate: z.coerce.date().nullable().optional(),
            metadata: z.record(z.string(), z.unknown()).optional(),
        })
        .refine((value) => Object.keys(value).length > 0, {
            message: 'At least one field must be provided in updates.',
            path: ['updates'],
        }),
});

export type UpdateComplianceItemPayload = z.infer<typeof updateComplianceItemSchema>;

export const listComplianceItemsQuerySchema = z.object({
    userId: z.uuid(),
});

export type ListComplianceItemsQuery = z.infer<typeof listComplianceItemsQuerySchema>;
