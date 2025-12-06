export interface PensionEligibilityConfig {
    minAge: number;
    maxAge: number;
    earningsThreshold: number;
    postponementDays: number;
}

export interface PensionEligibilityInput {
    age: number;
    annualEarnings: number;
    assessmentDate?: Date;
    postponementStart?: Date;
}

export interface PensionEligibilityResult {
    eligible: boolean;
    reason: string;
    reviewAfter?: Date;
}

const formatNumber = (value: number): string => value.toLocaleString('en-GB');

const defaultConfig: PensionEligibilityConfig = {
    minAge: 22,
    maxAge: 66,
    earningsThreshold: 10000,
    postponementDays: 90,
};

function computePostponementEnd(
    start: Date | undefined,
    days: number,
): Date | undefined {
    if (!start) {
        return undefined;
    }
    return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function evaluatePensionEligibility(
    input: PensionEligibilityInput,
    config: PensionEligibilityConfig = defaultConfig,
): PensionEligibilityResult {
    const assessmentDate = input.assessmentDate ?? new Date();
    const postponementEnd = computePostponementEnd(
        input.postponementStart,
        config.postponementDays,
    );

    if (postponementEnd && assessmentDate < postponementEnd) {
        return {
            eligible: false,
            reason: 'Postponement window still active.',
            reviewAfter: postponementEnd,
        };
    }

    if (input.age < config.minAge) {
        return {
            eligible: false,
            reason: `Age below auto-enrolment minimum (${formatNumber(config.minAge)}).`,
        };
    }
    if (input.age > config.maxAge) {
        return {
            eligible: false,
            reason: `Age above auto-enrolment maximum (${formatNumber(config.maxAge)}).`,
        };
    }
    if (input.annualEarnings < config.earningsThreshold) {
        return {
            eligible: false,
            reason: `Annual earnings below threshold (${formatNumber(config.earningsThreshold)}).`,
        };
    }

    return {
        eligible: true,
        reason: 'Meets age and earnings thresholds for auto-enrolment.',
    };
}

export { defaultConfig as defaultPensionEligibilityConfig };
