import {
    SecurityComplianceReportingService,
    type SecurityComplianceReportingServiceDependencies,
    type SecurityComplianceReportingServiceOptions,
} from './security-compliance-reporting-service';

function requireDependencies(
    overrides: Partial<SecurityComplianceReportingServiceDependencies> | undefined,
): SecurityComplianceReportingServiceDependencies {
    const securityComplianceRepository = overrides?.securityComplianceRepository;
    if (!securityComplianceRepository) {
        throw new Error('SecurityComplianceReportingService requires securityComplianceRepository dependency.');
    }

    return {
        securityComplianceRepository,
    };
}

export function getSecurityComplianceReportingService(
    overrides?: Partial<SecurityComplianceReportingServiceDependencies>,
    options?: SecurityComplianceReportingServiceOptions,
): SecurityComplianceReportingService {
    const dependencies = requireDependencies(overrides);
    return new SecurityComplianceReportingService(dependencies, options);
}
