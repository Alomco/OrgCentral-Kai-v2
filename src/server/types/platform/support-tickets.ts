import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { JsonRecord } from '@/server/types/json';

export const SUPPORT_TICKET_STATUSES = ['NEW', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type SupportTicketSeverity = (typeof SUPPORT_TICKET_SEVERITIES)[number];

export interface SupportTicket {
    id: string;
    orgId: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    tenantId: string;
    requesterEmail: string;
    requesterName?: string | null;
    subject: string;
    description: string;
    severity: SupportTicketSeverity;
    status: SupportTicketStatus;
    assignedTo?: string | null;
    slaBreached: boolean;
    tags: string[];
    metadata?: JsonRecord | null;
    createdAt: string;
    updatedAt: string;
}
