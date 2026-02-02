import { z } from 'zod';
import { BREAK_GLASS_SCOPES, BREAK_GLASS_STATUSES, type BreakGlassApproval } from '@/server/types/platform/break-glass';

export const breakGlassRequestSchema = z.object({
    scope: z.enum(BREAK_GLASS_SCOPES),
    reason: z.string().min(8).max(500),
    targetOrgId: z.uuid(),
    action: z.string().min(3).max(120),
    resourceId: z.string().min(1).max(160),
    expiresInMinutes: z.number().int().min(15).max(240).default(60),
});

export const breakGlassApproveSchema = z.object({
    approvalId: z.uuid(),
});

export const breakGlassListQuerySchema = z.object({
    scope: z.enum(BREAK_GLASS_SCOPES).optional(),
    status: z.enum(BREAK_GLASS_STATUSES).optional(),
});

export const breakGlassApprovalSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    requestedBy: z.uuid(),
    approvedBy: z.uuid().nullable().optional(),
    reason: z.string().min(8),
    scope: z.enum(BREAK_GLASS_SCOPES),
    status: z.enum(BREAK_GLASS_STATUSES),
    targetOrgId: z.uuid().nullable().optional().default(null),
    action: z.string().min(1).nullable().optional().default(null),
    resourceId: z.string().min(1).nullable().optional().default(null),
    createdAt: z.string(),
    approvedAt: z.string().nullable().optional(),
    expiresAt: z.string(),
    consumedAt: z.string().nullable().optional(),
    consumedBy: z.uuid().nullable().optional(),
}) satisfies z.ZodType<BreakGlassApproval>;

export type BreakGlassRequestInput = z.infer<typeof breakGlassRequestSchema>;
export type BreakGlassApproveInput = z.infer<typeof breakGlassApproveSchema>;
export type BreakGlassListQueryInput = z.infer<typeof breakGlassListQuerySchema>;

export function parseBreakGlassRequest(input: unknown) {
    return breakGlassRequestSchema.parse(input);
}

export function parseBreakGlassApprove(input: unknown) {
    return breakGlassApproveSchema.parse(input);
}

export function parseBreakGlassListQuery(input: unknown) {
    return breakGlassListQuerySchema.parse(input);
}

export function parseBreakGlassApproval(input: unknown): BreakGlassApproval {
    return breakGlassApprovalSchema.parse(input);
}
