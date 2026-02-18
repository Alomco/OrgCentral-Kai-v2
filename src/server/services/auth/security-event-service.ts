import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { buildTenantServiceContext } from '@/server/services/auth/service-context';
import type { LogSecurityEventInput, LogSecurityEventOutput } from '@/server/types/security-types';
import { logSecurityEvent } from '@/server/use-cases/auth/security/log-security-event';
import type { ISecurityEventRepository } from '@/server/repositories/contracts/auth/security/security-event-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import { buildSecurityEventServiceDependencies } from '@/server/repositories/providers/auth/security-event-service-dependencies';

const AUDIT_SOURCE = 'auth.security-event-service';

export interface SecurityEventServiceDependencies {
    securityEventRepository: ISecurityEventRepository;
    organizationRepository: IOrganizationRepository;
}

export class AuthSecurityEventService extends AbstractBaseService {
    constructor(private readonly dependencies: SecurityEventServiceDependencies) {
        super();
    }

    async logEvent(input: LogSecurityEventInput): Promise<LogSecurityEventOutput> {
        const organization = await this.dependencies.organizationRepository.getOrganization(input.orgId);
        const context = buildTenantServiceContext({
            orgId: input.orgId,
            userId: input.userId,
            dataResidency: organization?.dataResidency ?? 'UK_ONLY',
            dataClassification: organization?.dataClassification ?? 'OFFICIAL',
            auditSource: AUDIT_SOURCE,
            metadata: {
                eventType: input.eventType,
                severity: input.severity,
            },
        });

        return this.executeInServiceContext(context, 'auth.security.log-event', () =>
            logSecurityEvent(input, this.dependencies.securityEventRepository),
        );
    }
}

export type SecurityEventService = AuthSecurityEventService;

let sharedService: AuthSecurityEventService | null = null;

export function getSecurityEventService(
    overrides?: Partial<SecurityEventServiceDependencies>,
): AuthSecurityEventService {
    if (!sharedService || overrides) {
        const baseDependencies = buildSecurityEventServiceDependencies();
        const dependencies: SecurityEventServiceDependencies = {
            securityEventRepository:
                overrides?.securityEventRepository ?? baseDependencies.securityEventRepository,
            organizationRepository:
                overrides?.organizationRepository ?? baseDependencies.organizationRepository,
        };

        if (!overrides) {
            sharedService = new AuthSecurityEventService(dependencies);
            return sharedService;
        }

        return new AuthSecurityEventService(dependencies);
    }

    return sharedService;
}
