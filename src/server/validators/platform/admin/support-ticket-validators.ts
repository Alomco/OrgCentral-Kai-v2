import { z } from 'zod';
import {
    SUPPORT_TICKET_SEVERITIES,
    SUPPORT_TICKET_STATUSES,
    type SupportTicket,
} from '@/server/types/platform/support-tickets';

export const supportTicketCreateSchema = z.object({
    tenantId: z.uuid(),
    requesterEmail: z.email(),
    requesterName: z.string().min(1).max(120).optional(),
    subject: z.string().min(4).max(160),
    description: z.string().min(10).max(5000),
    severity: z.enum(SUPPORT_TICKET_SEVERITIES),
    tags: z.array(z.string().min(2).max(40)).default([]),
});

export const supportTicketUpdateSchema = z.object({
    ticketId: z.uuid(),
    status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
    assignedTo: z.uuid().nullable().optional(),
    slaBreached: z.boolean().optional(),
    tags: z.array(z.string().min(2).max(40)).optional(),
});

export const supportTicketSchema = z.object({
    id: z.uuid(),
    orgId: z.uuid(),
    dataResidency: z.enum(['UK_ONLY', 'UK_AND_EEA', 'GLOBAL_RESTRICTED']),
    dataClassification: z.enum(['OFFICIAL', 'OFFICIAL_SENSITIVE', 'SECRET', 'TOP_SECRET']),
    auditSource: z.string().min(1),
    tenantId: z.uuid(),
    requesterEmail: z.email(),
    requesterName: z.string().nullable().optional(),
    subject: z.string(),
    description: z.string(),
    severity: z.enum(SUPPORT_TICKET_SEVERITIES),
    status: z.enum(SUPPORT_TICKET_STATUSES),
    assignedTo: z.uuid().nullable().optional(),
    slaBreached: z.boolean(),
    tags: z.array(z.string()),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
}) satisfies z.ZodType<SupportTicket>;

export type SupportTicketCreateInput = z.infer<typeof supportTicketCreateSchema>;
export type SupportTicketUpdateInput = z.infer<typeof supportTicketUpdateSchema>;

export function parseSupportTicketCreate(input: unknown) {
    return supportTicketCreateSchema.parse(input);
}

export function parseSupportTicketUpdate(input: unknown) {
    return supportTicketUpdateSchema.parse(input);
}

export function parseSupportTicketRecord(input: unknown): SupportTicket {
    return supportTicketSchema.parse(input);
}
