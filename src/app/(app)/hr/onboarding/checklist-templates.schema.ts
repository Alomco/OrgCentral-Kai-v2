import { z } from 'zod';

export const checklistTemplateTypeSchema = z.enum(['onboarding', 'offboarding', 'custom']);

export const checklistTemplateCreateFormSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
    type: checklistTemplateTypeSchema,
    items: z.string().trim().min(1, 'At least one item is required'),
});

export type ChecklistTemplateCreateFormValues = z.infer<typeof checklistTemplateCreateFormSchema>;

export const checklistTemplateUpdateFormSchema = z.object({
    templateId: z.string().trim().min(1, 'Template id is required'),
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long').optional(),
    type: checklistTemplateTypeSchema.optional(),
    items: z.string().trim().min(1, 'At least one item is required').optional(),
});

export type ChecklistTemplateUpdateFormValues = z.infer<typeof checklistTemplateUpdateFormSchema>;

export const checklistTemplateDeleteFormSchema = z.object({
    templateId: z.string().trim().min(1, 'Template id is required'),
});

export type ChecklistTemplateDeleteFormValues = z.infer<typeof checklistTemplateDeleteFormSchema>;
