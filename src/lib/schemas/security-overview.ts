import { z } from 'zod';

export type JsonValue = null | boolean | number | string | JsonValue[] | JsonRecord;

export interface JsonRecord {
    readonly [key: string]: JsonValue;
}

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
    z.union([
        z.null(),
        z.boolean(),
        z.number(),
        z.string(),
        z.array(jsonValueSchema),
        z.record(z.string(), jsonValueSchema),
    ]),
);

const securitySessionSchema = z.object({
    sessionToken: z.string().min(1),
    status: z.string().min(1),
    ipAddress: z.string().min(1).nullable(),
    userAgent: z.string().min(1).nullable(),
    startedAt: z.iso.datetime(),
    lastAccess: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    isCurrent: z.boolean(),
});

const notificationPreferenceSchema = z.object({
    id: z.string().min(1),
    orgId: z.string().min(1),
    userId: z.string().min(1),
    channel: z.string().min(1),
    enabled: z.boolean(),
    quietHours: jsonValueSchema.optional(),
    metadata: jsonValueSchema.optional(),
    updatedAt: z.iso.datetime().optional(),
});

export const securityOverviewSchema = z.object({
    sessions: z.array(securitySessionSchema),
    notificationPreferences: z.array(notificationPreferenceSchema),
});

export type SecurityOverviewResponse = z.infer<typeof securityOverviewSchema>;
export type SecuritySessionSummary = z.infer<typeof securitySessionSchema>;
