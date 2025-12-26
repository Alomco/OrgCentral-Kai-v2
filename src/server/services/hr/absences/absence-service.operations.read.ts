import type { GetAbsencesInput, GetAbsencesResult } from '@/server/use-cases/hr/absences/get-absences';
import type { AnalyzeAbsenceAttachmentInput } from '@/server/use-cases/hr/absences/analyze-absence-attachment';
import { getAbsences } from '@/server/use-cases/hr/absences/get-absences';
import { analyzeAbsenceAttachment } from '@/server/use-cases/hr/absences/analyze-absence-attachment';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import type { AbsenceServiceRuntime } from './absence-service.operations.types';

export async function handleListAbsences(
    runtime: AbsenceServiceRuntime,
    input: GetAbsencesInput,
): Promise<GetAbsencesResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { filters: input.filters },
    });
    const filtersMetadata = input.filters
        ? {
            ...input.filters,
            from: input.filters.from?.toISOString(),
            to: input.filters.to?.toISOString(),
        }
        : undefined;

    return runtime.runOperation(
        'hr.absences.list',
        input.authorization,
        filtersMetadata ? { filters: filtersMetadata } : undefined,
        () => getAbsences(runtime.dependencies, input),
    );
}

export async function handleAnalyzeAttachment(
    runtime: AbsenceServiceRuntime,
    input: AnalyzeAbsenceAttachmentInput,
) {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.READ,
        resourceType: HR_RESOURCE.HR_ABSENCE_AI_VALIDATION,
        resourceAttributes: { absenceId: input.absenceId },
    });
    return runtime.runOperation(
        'hr.absences.attachments.analyze',
        input.authorization,
        { absenceId: input.absenceId },
        () => analyzeAbsenceAttachment(runtime.dependencies, input),
    );
}
