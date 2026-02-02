import { z } from 'zod';
import { IMPERSONATION_STATUSES, type ImpersonationRequest, type ImpersonationSession } from '@/server/types/platform/impersonation';

export const impersonationRequestSchema = z.object({
    targetUserId: z.uuid(),
    targetOrgId: z.uuid(),
    reason: z.string().min(8).max(500),
    expiresInMinutes: z.number().int().min(15).max(120).default(30),
    breakGlassApprovalId: z.uuid().optional(),
});

export const impersonationApproveSchema = z.object({
    requestId: z.uuid(),
});

export const impersonationStopSchema = z.object({
    sessionId: z.uuid(),
    reason: z.string().min(4).max(200).optional(),
});

export const impersonationRequestRecordSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    requestedBy: z.uuid(),
    targetUserId: z.uuid(),
    targetOrgId: z.uuid(),
    reason: z.string().min(8),
    status: z.enum(IMPERSONATION_STATUSES),
    approvedBy: z.uuid().nullable().optional(),
    approvedAt: z.string().nullable().optional(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}) satisfies z.ZodType<ImpersonationRequest>;

export const impersonationSessionRecordSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    requestId: z.uuid(),
    startedBy: z.uuid(),
    targetUserId: z.uuid(),
    targetOrgId: z.uuid(),
    status: z.enum(IMPERSONATION_STATUSES),
    sessionToken: z.string().min(16),
    startedAt: z.string(),
    expiresAt: z.string(),
    revokedAt: z.string().nullable().optional(),
}) satisfies z.ZodType<ImpersonationSession>;

export type ImpersonationRequestInput = z.infer<typeof impersonationRequestSchema>;
export type ImpersonationApproveInput = z.infer<typeof impersonationApproveSchema>;
export type ImpersonationStopInput = z.infer<typeof impersonationStopSchema>;

export function parseImpersonationRequest(input: unknown) {
    return impersonationRequestSchema.parse(input);
}

export function parseImpersonationApprove(input: unknown) {
    return impersonationApproveSchema.parse(input);
}

export function parseImpersonationStop(input: unknown) {
    return impersonationStopSchema.parse(input);
}

export function parseImpersonationRequestRecord(input: unknown): ImpersonationRequest {
    return impersonationRequestRecordSchema.parse(input);
}

export function parseImpersonationSessionRecord(input: unknown): ImpersonationSession {
    return impersonationSessionRecordSchema.parse(input);
}
