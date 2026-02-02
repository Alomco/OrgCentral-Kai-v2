import { z } from 'zod';
import { BILLING_PLAN_CADENCES, BILLING_PLAN_STATUSES, type BillingPlan } from '@/server/types/platform/billing-plan';

export const billingPlanSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    name: z.string().min(2).max(120),
    description: z.string().max(600).nullable().optional(),
    stripePriceId: z.string().min(4),
    currency: z.string().min(3).max(3).default('gbp'),
    amountCents: z.number().int().min(0),
    cadence: z.enum(BILLING_PLAN_CADENCES),
    features: z.array(z.string().min(2).max(120)).default([]),
    limits: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    status: z.enum(BILLING_PLAN_STATUSES),
    effectiveFrom: z.string(),
    effectiveTo: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
}) satisfies z.ZodType<BillingPlan>;

export const billingPlanCreateSchema = billingPlanSchema.omit({
    id: true,
    orgId: true,
    dataResidency: true,
    dataClassification: true,
    auditSource: true,
    createdAt: true,
    updatedAt: true,
});

export const billingPlanUpdateSchema = billingPlanCreateSchema.partial().extend({
    id: z.uuid(),
});

export const billingPlanAssignSchema = z.object({
    tenantId: z.uuid(),
    planId: z.uuid(),
    effectiveFrom: z.string().optional(),
    prorationBehavior: z.enum(['create_prorations', 'always_invoice', 'none']).optional(),
});

export type BillingPlanCreateInput = z.infer<typeof billingPlanCreateSchema>;
export type BillingPlanUpdateInput = z.infer<typeof billingPlanUpdateSchema>;
export type BillingPlanAssignInput = z.infer<typeof billingPlanAssignSchema>;

export function parseBillingPlanCreate(input: unknown) {
    return billingPlanCreateSchema.parse(input);
}

export function parseBillingPlanUpdate(input: unknown) {
    return billingPlanUpdateSchema.parse(input);
}

export function parseBillingPlanAssign(input: unknown) {
    return billingPlanAssignSchema.parse(input);
}

export function parseBillingPlanRecord(input: unknown): BillingPlan {
    return billingPlanSchema.parse(input);
}
