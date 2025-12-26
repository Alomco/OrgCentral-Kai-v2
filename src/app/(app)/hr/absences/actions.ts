'use server';

import { revalidatePath } from 'next/cache';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getAbsenceService } from '@/server/services/hr/absences/absence-service.provider';

import type { CancelAbsenceFormState, ReportAbsenceFormState } from './form-state';
import { cancelAbsenceSchema, reportAbsenceSchema } from './schema';

function formDataString(value: FormDataEntryValue | null): string {
    return typeof value === 'string' ? value : '';
}

export async function reportAbsenceAction(
    authorization: RepositoryAuthorizationContext,
    _previousState: ReportAbsenceFormState,
    formData: FormData,
): Promise<ReportAbsenceFormState> {
    const raw = {
        typeId: formData.get('typeId'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        hours: formData.get('hours'),
        reason: formData.get('reason'),
    };

    const parsed = reportAbsenceSchema.safeParse(raw);

    if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof typeof raw, string>> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0] as keyof typeof raw;
            fieldErrors[field] ??= issue.message;
        }
        return {
            status: 'error',
            message: 'Please fix the errors below.',
            fieldErrors,
            values: {
                typeId: formDataString(raw.typeId),
                startDate: formDataString(raw.startDate),
                endDate: formDataString(raw.endDate),
                hours: Number(raw.hours ?? 0),
                reason: formDataString(raw.reason),
            },
        };
    }

    try {
        const service = getAbsenceService();
        await service.reportAbsence({
            authorization,
            payload: {
                userId: authorization.userId,
                typeId: parsed.data.typeId,
                startDate: new Date(parsed.data.startDate),
                endDate: new Date(parsed.data.endDate ?? parsed.data.startDate),
                hours: parsed.data.hours,
                reason: parsed.data.reason,
            },
        });

        revalidatePath('/hr/absences');

        return {
            status: 'success',
            message: 'Absence reported successfully.',
            values: {
                typeId: '',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '',
                hours: 8,
                reason: '',
            },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to report absence.';
        return {
            status: 'error',
            message,
            values: parsed.data,
        };
    }
}

/** Cancel an absence with reason validation. */
export async function cancelAbsenceAction(
    authorization: RepositoryAuthorizationContext,
    absenceId: string,
    _previousState: CancelAbsenceFormState,
    formData: FormData,
): Promise<CancelAbsenceFormState> {
    const raw = { reason: formData.get('reason') };
    const parsed = cancelAbsenceSchema.safeParse(raw);

    if (!parsed.success) {
        const fieldErrors: Partial<Record<'reason', string>> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0] as 'reason';
            fieldErrors[field] ??= issue.message;
        }
        return {
            status: 'error',
            message: 'Please provide a valid reason.',
            fieldErrors,
            values: { reason: formDataString(raw.reason) },
        };
    }

    try {
        const service = getAbsenceService();
        await service.cancelAbsence({
            authorization,
            absenceId,
            payload: { reason: parsed.data.reason },
        });

        revalidatePath('/hr/absences');

        return {
            status: 'success',
            message: 'Absence cancelled successfully.',
            values: { reason: '' },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel absence.';
        return {
            status: 'error',
            message,
            values: parsed.data,
        };
    }
}

