import {
    SecurityMetricsService,
    type SecurityMetricsServiceDependencies,
    type SecurityMetricsServiceOptions,
} from './security-metrics-service';
import {
    createSecurityMetricsRepository,
    type SecurityMetricsRepositoryOptions,
} from '@/server/repositories/providers/security/security-metrics-repository-provider';

export interface SecurityMetricsServiceProviderOptions {
    serviceOptions?: SecurityMetricsServiceOptions;
    repositoryOptions?: SecurityMetricsRepositoryOptions;
}

export function getSecurityMetricsService(
    overrides?: Partial<SecurityMetricsServiceDependencies>,
    options?: SecurityMetricsServiceProviderOptions,
): SecurityMetricsService {
    const dependencies: SecurityMetricsServiceDependencies = {
        securityMetricsRepository: overrides?.securityMetricsRepository
            ?? createSecurityMetricsRepository(options?.repositoryOptions),
    };

    return new SecurityMetricsService(dependencies, options?.serviceOptions);
}
