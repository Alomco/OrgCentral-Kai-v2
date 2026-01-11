import { AbsenceService } from '@/server/services/hr/absences/absence-service';
import { getAbsenceService } from '@/server/services/hr/absences/absence-service.provider';
import type { GetSessionDependencies } from '@/server/use-cases/auth/sessions/get-session';

type AbsenceServiceContract = Pick<
    AbsenceService,
    | 'listAbsences'
    | 'reportAbsence'
    | 'approveAbsence'
    | 'updateAbsence'
    | 'addAttachments'
    | 'removeAttachment'
    | 'recordReturnToWork'
    | 'deleteAbsence'
    | 'acknowledgeAbsence'
    | 'cancelAbsence'
    | 'updateSettings'
    | 'analyzeAttachment'
>;

export interface ResolvedAbsenceControllerDependencies {
    session: GetSessionDependencies;
    service: AbsenceServiceContract;
}

export type AbsenceControllerDependencies = Partial<ResolvedAbsenceControllerDependencies>;

const sharedAbsenceService = getAbsenceService();

export const defaultAbsenceControllerDependencies: ResolvedAbsenceControllerDependencies = {
    session: {},
    service: sharedAbsenceService,
};

export function resolveAbsenceControllerDependencies(
    overrides?: AbsenceControllerDependencies,
): ResolvedAbsenceControllerDependencies {
    if (!overrides) {
        return defaultAbsenceControllerDependencies;
    }

    return {
        session: overrides.session ?? defaultAbsenceControllerDependencies.session,
        service: overrides.service ?? defaultAbsenceControllerDependencies.service,
    };
}

