import { context, trace } from '@opentelemetry/api';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { IAuditLogRepository } from '@/server/repositories/contracts/records/audit-log-repository-contract';
import { PrismaAuditLogRepository } from '@/server/repositories/prisma/records/audit/prisma-audit-log-repository';

export interface AuditEventPayload {
    orgId: string;
    userId?: string;
    eventType: 'ACCESS' | 'DATA_CHANGE' | 'POLICY_CHANGE' | 'AUTH' | 'SYSTEM';
    action: string;
    resource: string;
    resourceId?: string;
    payload?: Record<string, unknown>;
    correlationId?: string;
    residencyZone?: DataResidencyZone;
    classification?: DataClassificationLevel;
    auditSource?: string;
    auditBatchId?: string;
    spanId?: string;
    immutable?: boolean;
}

let auditLogRepository: IAuditLogRepository = new PrismaAuditLogRepository();

export function setAuditLogRepository(repository: IAuditLogRepository): void {
    auditLogRepository = repository;
}

export async function recordAuditEvent(event: AuditEventPayload): Promise<void> {
    const activeSpan = trace.getSpan(context.active());
    const spanId = event.spanId ?? activeSpan?.spanContext().spanId;

    await auditLogRepository.create({
        orgId: event.orgId,
        userId: event.userId ?? null,
        eventType: event.eventType,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId ?? null,
        immutable: event.immutable ?? true,
        payload: {
            ...event.payload,
            correlationId: event.correlationId,
            residencyZone: event.residencyZone,
            classification: event.classification,
            auditSource: event.auditSource,
            auditBatchId: event.auditBatchId,
            spanId,
            immutable: event.immutable ?? true,
        },
    });
}
