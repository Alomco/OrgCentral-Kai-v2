import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
export interface AbsenceAttachmentPayload { fileName: string; storageKey: string; contentType: string; fileSize: number; checksum?: string | null; metadata?: unknown }

export const absenceAttachmentKeys = {
    list: (absenceId: string) => ['hr', 'absence', absenceId, 'attachments'] as const,
} as const;

export async function attachAbsenceEvidence(
    absenceId: string,
    attachments: AbsenceAttachmentPayload[],
): Promise<UnplannedAbsence> {
    const response = await fetch(`/api/hr/absences/${absenceId}/attachments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attachments }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to attach evidence.');
    }

    const result = (await response.json()) as { absence: UnplannedAbsence };
    return result.absence;
}

export async function removeAbsenceAttachment(
    absenceId: string,
    attachmentId: string,
): Promise<UnplannedAbsence> {
    const response = await fetch(`/api/hr/absences/${absenceId}/attachments`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attachmentId }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to remove attachment.');
    }

    const result = (await response.json()) as { absence: UnplannedAbsence };
    return result.absence;
}


