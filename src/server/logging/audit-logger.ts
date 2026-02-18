import { context, trace } from '@opentelemetry/api';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { IAuditLogRepository } from '@/server/repositories/contracts/records/audit-log-repository-contract';
import { PrismaAuditLogRepository } from '@/server/repositories/prisma/records/audit/prisma-audit-log-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { sanitizeLogMetadata } from '@/server/logging/log-sanitizer';

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
    const authorization = buildAuditAuthorizationContext(event);
    const sanitizedPayload = event.payload ? sanitizeLogMetadata(event.payload) : undefined;

    await auditLogRepository.create(authorization, {
        orgId: event.orgId,
        userId: event.userId ?? null,
        eventType: event.eventType,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId ?? null,
        immutable: event.immutable ?? true,
        payload: {
            ...sanitizedPayload,
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

function buildAuditAuthorizationContext(event: AuditEventPayload): RepositoryAuthorizationContext {
    const ipValue = event.payload?.ipAddress;
    const ipAddress = typeof ipValue === 'string' ? ipValue : undefined;

    const dataClassification = event.classification ?? 'OFFICIAL';
    const dataResidency = event.residencyZone ?? 'UK_ONLY';
    const auditSource = event.auditSource ?? 'audit_logger';

    return {
        orgId: event.orgId,
        dataResidency,
        dataClassification,
        auditSource,
        auditBatchId: event.auditBatchId,
        tenantScope: {
            orgId: event.orgId,
            dataResidency,
            dataClassification,
            auditSource,
            auditBatchId: event.auditBatchId,
        },
        userId: event.userId ?? 'system',
        roleKey: 'custom',
        sessionId: 'audit-log-session',
        roles: [],
        permissions: {},
        mfaVerified: true,
        ipAddress: ipAddress ?? '127.0.0.1',
        userAgent: 'audit-logger',
        authenticatedAt: new Date(),
        sessionExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        lastActivityAt: new Date(),
        requiresMfa: false,
        piiAccessRequired: false,
        dataBreachRisk: false,
        sessionToken: 'audit-log-token',
        authorizedAt: new Date(),
        authorizationReason: 'system_audit_event',
    };
}
