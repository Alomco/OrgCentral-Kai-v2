import {
    SecurityAlertService,
} from './security-alert-service';
import type {
    SecurityAlertServiceDependencies,
    SecurityAlertServiceOptions,
} from './security-alert-contracts';

function requireDependencies(
    overrides: Partial<SecurityAlertServiceDependencies> | undefined,
): SecurityAlertServiceDependencies {
    const securityAlertRepository = overrides?.securityAlertRepository;
    if (!securityAlertRepository) {
        throw new Error('SecurityAlertService requires securityAlertRepository dependency.');
    }

    return {
        securityAlertRepository,
        guard: overrides.guard,
    };
}

export function getSecurityAlertService(
    overrides?: Partial<SecurityAlertServiceDependencies>,
    options?: SecurityAlertServiceOptions,
): SecurityAlertService {
    const dependencies = requireDependencies(overrides);
    return new SecurityAlertService(dependencies, options);
}
