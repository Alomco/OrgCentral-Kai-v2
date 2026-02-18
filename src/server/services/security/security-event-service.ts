import { randomUUID } from 'node:crypto';
import type { ISecurityEventRepository } from '@/server/repositories/contracts/security/enhanced-security-repository-contracts';
import type { EnhancedSecurityEvent } from '@/server/types/enhanced-security-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { JsonRecord } from '@/server/types/json';
import type { OrgAccessContext, OrgAccessInput } from '@/server/security/guards/core';
import { assertOrgAccessWithAbac, toTenantScope } from '@/server/security/guards/core';
import { appLogger } from '@/server/logging/structured-logger';
import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { dispatchSecurityAlert } from './security-alert-dispatcher';

export interface SecurityEventServiceDependencies {
    securityEventRepository: ISecurityEventRepository;
    guard?: (input: OrgAccessInput) => Promise<OrgAccessContext>;
}

export interface LogSecurityEventInput {
    orgId: string;
    eventType: string;
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    description: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    resourceId?: string;
    resourceType?: string;
    piiAccessed?: boolean;
    dataClassification?: DataClassificationLevel;
    dataResidency?: DataResidencyZone;
    metadata?: JsonRecord;
    piiDetected?: boolean;
    dataBreachPotential?: boolean;
    remediationSteps?: string[];
    auditSource?: string;
    correlationId?: string;
    requiresMfa?: boolean;
}

export class SecurityEventService extends AbstractBaseService {
    private readonly guard: (input: OrgAccessInput) => Promise<OrgAccessContext>;

    constructor(private readonly dependencies: SecurityEventServiceDependencies) {
        super();
        this.guard = dependencies.guard ?? assertOrgAccessWithAbac;
    }

    async logSecurityEvent(input: LogSecurityEventInput): Promise<EnhancedSecurityEvent> {
        const authorization = await this.buildAuthorizationContext(input);

        const eventPayload = {
            orgId: input.orgId,
            eventType: input.eventType,
            severity: input.severity,
            description: input.description,
            userId: input.userId,
            ipAddress: input.ipAddress ?? 'unknown',
            userAgent: input.userAgent ?? 'unknown',
            resourceId: input.resourceId,
            resourceType: input.resourceType,
            piiAccessed: input.piiAccessed,
            dataClassification: authorization.dataClassification,
            dataResidency: authorization.dataResidency,
            metadata: input.metadata,
            piiDetected: input.piiDetected,
            dataBreachPotential: input.dataBreachPotential,
            remediationSteps: input.remediationSteps,
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            tenantScope: authorization.tenantScope,
        } satisfies Omit<EnhancedSecurityEvent, 'id' | 'createdAt' | 'updatedAt'>;

        const created = await this.dependencies.securityEventRepository.createEvent(authorization, eventPayload);
        appLogger.debug('security-event.created', {
            orgId: created.orgId,
            eventType: created.eventType,
            severity: created.severity,
            classification: created.dataClassification,
            residency: created.dataResidency,
            correlationId: authorization.correlationId,
        });
        if (created.severity === 'high' || created.severity === 'critical') {
            const alertOrgId = created.orgId ?? input.orgId;
            const alertUserId = created.userId ?? input.userId;
            await dispatchSecurityAlert({
                orgId: alertOrgId,
                eventType: created.eventType,
                severity: created.severity,
                description: created.description,
                userId: alertUserId,
                correlationId: authorization.correlationId,
                occurredAt: created.createdAt.toISOString(),
            });
        }
        return created;
    }

    async getSecurityEvent(
        context: RepositoryAuthorizationContext,
        eventId: string,
    ): Promise<EnhancedSecurityEvent | null> {
        return this.dependencies.securityEventRepository.getEvent(context, eventId);
    }

    async getSecurityEventsByOrg(
        context: RepositoryAuthorizationContext,
        filters?: {
            startDate?: Date;
            endDate?: Date;
            severity?: string;
            eventType?: string;
            limit?: number;
            offset?: number;
        },
    ): Promise<EnhancedSecurityEvent[]> {
        return this.dependencies.securityEventRepository.getEventsByOrg(context, filters);
    }

    async countSecurityEventsByOrg(
        context: RepositoryAuthorizationContext,
        filters?: {
            startDate?: Date;
            endDate?: Date;
            severity?: string;
            eventType?: string;
        },
    ): Promise<number> {
        return this.dependencies.securityEventRepository.countEventsByOrg(context, filters);
    }

    private async buildAuthorizationContext(input: LogSecurityEventInput): Promise<RepositoryAuthorizationContext> {
        const guardInput: OrgAccessInput = {
            orgId: input.orgId,
            userId: input.userId,
            auditSource: input.auditSource ?? 'security-event-service',
            correlationId: input.correlationId,
            expectedClassification: input.dataClassification,
            expectedResidency: input.dataResidency,
        };

        const accessContext = await this.guard(guardInput);
        const now = new Date();
        const sessionId = accessContext.auditBatchId ?? randomUUID();

        const roles: string[] = [accessContext.roleKey];
        if (accessContext.roleName && !roles.includes(accessContext.roleName)) {
            roles.push(accessContext.roleName);
        }

        return {
            orgId: accessContext.orgId,
            userId: accessContext.userId,
            roleKey: accessContext.roleKey,
            roleName: accessContext.roleName,
            roleId: accessContext.roleId,
            roleScope: accessContext.roleScope,
            permissions: accessContext.permissions,
            dataResidency: input.dataResidency ?? accessContext.dataResidency,
            dataClassification: input.dataClassification ?? accessContext.dataClassification,
            auditSource: guardInput.auditSource ?? 'security-event-service',
            auditBatchId: accessContext.auditBatchId,
            tenantScope: toTenantScope(accessContext),
            sessionId,
            roles,
            mfaVerified: input.requiresMfa ?? false,
            ipAddress: input.ipAddress ?? 'unknown',
            userAgent: input.userAgent ?? 'unknown',
            authenticatedAt: now,
            sessionExpiresAt: new Date(now.getTime() + 30 * 60 * 1000),
            lastActivityAt: now,
            requiresMfa: input.requiresMfa ?? false,
            piiAccessRequired: input.piiAccessed ?? input.piiDetected ?? false,
            dataBreachRisk: input.dataBreachPotential ?? false,
            sessionToken: sessionId,
            authorizedAt: now,
            authorizationReason: input.resourceType ?? input.eventType,
            correlationId: accessContext.correlationId,
        } satisfies RepositoryAuthorizationContext;
    }
}
