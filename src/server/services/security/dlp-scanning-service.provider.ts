import {
    DlpScanningService,
    type DlpScanningServiceDependencies,
    type DlpScanningServiceOptions,
} from './dlp-scanning-service';

function requireDependencies(
    overrides: Partial<DlpScanningServiceDependencies> | undefined,
): DlpScanningServiceDependencies {
    const dlpPolicyRepository = overrides?.dlpPolicyRepository;
    const dlpScanResultRepository = overrides?.dlpScanResultRepository;

    if (!dlpPolicyRepository || !dlpScanResultRepository) {
        throw new Error(
            'DlpScanningService requires dlpPolicyRepository and dlpScanResultRepository dependencies.',
        );
    }

    return {
        dlpPolicyRepository,
        dlpScanResultRepository,
    };
}

export function getDlpScanningService(
    overrides?: Partial<DlpScanningServiceDependencies>,
    options?: DlpScanningServiceOptions,
): DlpScanningService {
    const dependencies = requireDependencies(overrides);
    return new DlpScanningService(dependencies, options);
}
