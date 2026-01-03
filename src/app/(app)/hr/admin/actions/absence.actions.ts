'use server';

/**
 * Absence Management Admin Actions
 * Single Responsibility: Server actions for absence acknowledgment/approval
 */

import { revalidatePath } from 'next/cache';
import { headers as nextHeaders } from 'next/headers';

import { PrismaUnplannedAbsenceRepository } from '@/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository';
import { acknowledgeUnplannedAbsence } from '@/server/use-cases/hr/absences/acknowledge-unplanned-absence';
import { approveUnplannedAbsence } from '@/server/use-cases/hr/absences/approve-unplanned-absence';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { acknowledgeAbsenceFormSchema, approveAbsenceFormSchema } from '../_schemas';
import type { AbsenceAcknowledgeFormState } from '../_types';

function readOptionalString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') {return undefined;}
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

/** Dependency injection factory */
function createAbsenceDependencies() {
    return {
        absenceRepository: new PrismaUnplannedAbsenceRepository(),
    };
}

export async function acknowledgeAbsenceAction(
    _previous: AbsenceAcknowledgeFormState,
    formData: FormData,
): Promise<AbsenceAcknowledgeFormState> {
    const headerStore = await nextHeaders();

    let authorization;
    try {
        const session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:admin:absence:acknowledge',
        });
        authorization = session.authorization;
    } catch {
        return { status: 'error', message: 'Not authorized to acknowledge absences.' };
    }

    const parsed = acknowledgeAbsenceFormSchema.safeParse({
        absenceId: formData.get('absenceId'),
        note: readOptionalString(formData, 'note'),
    });

    if (!parsed.success) {
        const firstError = parsed.error.issues.at(0);
        const message = firstError?.message ?? 'Invalid form data';
        return { status: 'error', message };
    }

    try {
        const deps = createAbsenceDependencies();
        await acknowledgeUnplannedAbsence(deps, {
            authorization,
            absenceId: parsed.data.absenceId,
            payload: { note: parsed.data.note },
        });

        revalidatePath('/hr/admin');
        revalidatePath('/hr/absences');

        return { 
            status: 'success', 
            message: 'Absence acknowledged successfully.',
            absenceId: parsed.data.absenceId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to acknowledge absence.';
        return { status: 'error', message };
    }
}

export async function approveAbsenceAction(
    _previous: AbsenceAcknowledgeFormState,
    formData: FormData,
): Promise<AbsenceAcknowledgeFormState> {
    const headerStore = await nextHeaders();

    let authorization;
    try {
        const session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:admin:absence:approve',
        });
        authorization = session.authorization;
    } catch {
        return { status: 'error', message: 'Not authorized to approve absences.' };
    }

    const parsed = approveAbsenceFormSchema.safeParse({
        absenceId: formData.get('absenceId'),
        returnDate: readOptionalString(formData, 'returnDate'),
        notes: readOptionalString(formData, 'notes'),
    });

    if (!parsed.success) {
        const firstError = parsed.error.issues.at(0);
        const message = firstError?.message ?? 'Invalid form data';
        return { status: 'error', message };
    }

    try {
        const deps = createAbsenceDependencies();
        await approveUnplannedAbsence(deps, {
            authorization,
            absenceId: parsed.data.absenceId,
            payload: {
                status: 'APPROVED',
                reason: parsed.data.notes,
            },
        });

        revalidatePath('/hr/admin');
        revalidatePath('/hr/absences');

        return { 
            status: 'success', 
            message: 'Absence approved successfully.',
            absenceId: parsed.data.absenceId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to approve absence.';
        return { status: 'error', message };
    }
}
