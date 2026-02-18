import {
    SecurityAuditLoggingService,
    type SecurityAuditLoggingServiceDependencies,
    type SecurityAuditLoggingServiceOptions,
} from './security-audit-logging-service';

function requireDependencies(
    overrides: Partial<SecurityAuditLoggingServiceDependencies> | undefined,
): SecurityAuditLoggingServiceDependencies {
    const securityEventRepository = overrides?.securityEventRepository;
    if (!securityEventRepository) {
        throw new Error('SecurityAuditLoggingService requires securityEventRepository dependency.');
    }

    return {
        securityEventRepository,
    };
}

export function getSecurityAuditLoggingService(
    overrides?: Partial<SecurityAuditLoggingServiceDependencies>,
    options?: SecurityAuditLoggingServiceOptions,
): SecurityAuditLoggingService {
    const dependencies = requireDependencies(overrides);
    return new SecurityAuditLoggingService(dependencies, options);
}
