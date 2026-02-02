import { z } from 'zod';
import type { PlatformToolExecution } from '@/server/types/platform/platform-tools';

export const platformToolExecuteSchema = z.object({
    toolId: z.string().min(2),
    dryRun: z.boolean().default(true),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
    breakGlassApprovalId: z.uuid().optional(),
});

export const platformToolExecutionSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    toolId: z.string().min(2),
    requestedBy: z.uuid(),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
    dryRun: z.boolean(),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    output: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable().optional(),
    createdAt: z.string(),
    completedAt: z.string().nullable().optional(),
}) satisfies z.ZodType<PlatformToolExecution>;

export type PlatformToolExecuteInput = z.infer<typeof platformToolExecuteSchema>;

export function parsePlatformToolExecute(input: unknown) {
    return platformToolExecuteSchema.parse(input);
}

export function parsePlatformToolExecution(input: unknown): PlatformToolExecution {
    return platformToolExecutionSchema.parse(input);
}
