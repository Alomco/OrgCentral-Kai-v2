import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import type { SecurityEvent } from './hr-types';

export interface PermissionResource {
    id: string;
    orgId: string;
    resource: string;
    actions: string[];
    description?: string | null;
    metadata?: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
}

export const LogSecurityEventRequestSchema = z.object({
    orgId: z.uuid(),
    eventType: z.string().min(1),
    severity: z.string().min(1),
    description: z.string().min(1),
    ipAddress: z.string().min(1).optional().nullable(),
    userAgent: z.string().min(1).optional().nullable(),
    resourceId: z.string().min(1).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LogSecurityEventRequest = z.infer<typeof LogSecurityEventRequestSchema>;

export type LogSecurityEventInput = LogSecurityEventRequest & { userId: string };

export interface LogSecurityEventOutput {
    success: true;
}

export type SecurityEventCreatePayload = Omit<SecurityEvent, 'id' | 'createdAt' | 'updatedAt'>;
