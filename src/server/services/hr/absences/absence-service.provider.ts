import {
    buildAbsenceServiceDependencies,
    type AbsenceServiceDependencyOptions,
} from '@/server/repositories/providers/hr/absence-service-dependencies';
import { AbsenceService, type AbsenceServiceDependencies } from './absence-service';

export interface AbsenceServiceProviderOptions {
    prismaOptions?: AbsenceServiceDependencyOptions['prismaOptions'];
}

const defaultDependencies = buildAbsenceServiceDependencies();
const sharedAbsenceService = new AbsenceService(defaultDependencies);

export function getAbsenceService(
    overrides?: Partial<AbsenceServiceDependencies>,
    options?: AbsenceServiceProviderOptions,
): AbsenceService {
    if (!overrides && !options) {
        return sharedAbsenceService;
    }

    const deps = buildAbsenceServiceDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });

    return new AbsenceService({
        ...deps,
    });
}

export type AbsenceServiceContract = Pick<AbsenceService, 'listAbsences' | 'cancelAbsence'>;
