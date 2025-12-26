import type { AcknowledgeUnplannedAbsenceInput, AcknowledgeUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/acknowledge-unplanned-absence';
import type { AddAbsenceAttachmentsInput, AddAbsenceAttachmentsResult } from '@/server/use-cases/hr/absences/add-absence-attachments';
import type { CancelUnplannedAbsenceInput, CancelUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/cancel-unplanned-absence';
import type { RemoveAbsenceAttachmentInput, RemoveAbsenceAttachmentResult } from '@/server/use-cases/hr/absences/remove-absence-attachment';
import type { ReportUnplannedAbsenceInput, ReportUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/report-unplanned-absence';
import type { ApproveUnplannedAbsenceInput, ApproveUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/approve-unplanned-absence';
import type { UpdateUnplannedAbsenceInput, UpdateUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/update-unplanned-absence';
import type { RecordReturnToWorkInput, RecordReturnToWorkResult } from '@/server/use-cases/hr/absences/record-return-to-work';
import type { DeleteUnplannedAbsenceInput, DeleteUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/delete-unplanned-absence';
import type { UpdateAbsenceSettingsInput, UpdateAbsenceSettingsResult } from '@/server/use-cases/hr/absences/update-absence-settings';
import { acknowledgeUnplannedAbsence } from '@/server/use-cases/hr/absences/acknowledge-unplanned-absence';
import { addAbsenceAttachments } from '@/server/use-cases/hr/absences/add-absence-attachments';
import { cancelUnplannedAbsence } from '@/server/use-cases/hr/absences/cancel-unplanned-absence';
import { removeAbsenceAttachment } from '@/server/use-cases/hr/absences/remove-absence-attachment';
import { reportUnplannedAbsence } from '@/server/use-cases/hr/absences/report-unplanned-absence';
import { approveUnplannedAbsence } from '@/server/use-cases/hr/absences/approve-unplanned-absence';
import { updateUnplannedAbsence } from '@/server/use-cases/hr/absences/update-unplanned-absence';
import { recordReturnToWork } from '@/server/use-cases/hr/absences/record-return-to-work';
import { deleteUnplannedAbsence } from '@/server/use-cases/hr/absences/delete-unplanned-absence';
import { updateAbsenceSettings } from '@/server/use-cases/hr/absences/update-absence-settings';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import type { AbsenceServiceRuntime } from './absence-service.operations.types';

export async function handleReportAbsence(
    runtime: AbsenceServiceRuntime,
    input: ReportUnplannedAbsenceInput,
): Promise<ReportUnplannedAbsenceResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.CREATE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { targetUserId: input.payload.userId, reason: input.payload.reason ?? null },
    });
    return runtime.runOperation(
        'hr.absences.report',
        input.authorization,
        { targetUserId: input.payload.userId },
        () => reportUnplannedAbsence(runtime.dependencies, input),
    );
}

export async function handleApproveAbsence(
    runtime: AbsenceServiceRuntime,
    input: ApproveUnplannedAbsenceInput,
): Promise<ApproveUnplannedAbsenceResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.APPROVE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId, decision: input.payload.status ?? 'APPROVED' },
    });
    const decision = input.payload.status ?? 'APPROVED';
    return runtime.runOperation(
        'hr.absences.approve',
        input.authorization,
        {
            absenceId: input.absenceId,
            decision,
        },
        () => approveUnplannedAbsence(runtime.dependencies, input),
    );
}

export async function handleUpdateAbsence(
    runtime: AbsenceServiceRuntime,
    input: UpdateUnplannedAbsenceInput,
): Promise<UpdateUnplannedAbsenceResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId },
    });
    return runtime.runOperation(
        'hr.absences.update',
        input.authorization,
        { absenceId: input.absenceId },
        () => updateUnplannedAbsence(runtime.dependencies, input),
    );
}

export async function handleAddAttachments(
    runtime: AbsenceServiceRuntime,
    input: AddAbsenceAttachmentsInput,
): Promise<AddAbsenceAttachmentsResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId, attachmentCount: input.payload.attachments.length },
    });
    return runtime.runOperation(
        'hr.absences.attachments.add',
        input.authorization,
        {
            absenceId: input.absenceId,
            attachmentCount: input.payload.attachments.length,
        },
        () => addAbsenceAttachments(runtime.dependencies, input),
    );
}

export async function handleRemoveAttachment(
    runtime: AbsenceServiceRuntime,
    input: RemoveAbsenceAttachmentInput,
): Promise<RemoveAbsenceAttachmentResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId, attachmentId: input.payload.attachmentId },
    });
    return runtime.runOperation(
        'hr.absences.attachments.remove',
        input.authorization,
        {
            absenceId: input.absenceId,
            attachmentId: input.payload.attachmentId,
        },
        () => removeAbsenceAttachment(runtime.dependencies, input),
    );
}

export async function handleRecordReturnToWork(
    runtime: AbsenceServiceRuntime,
    input: RecordReturnToWorkInput,
): Promise<RecordReturnToWorkResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId, returnDate: input.payload.returnDate },
    });
    return runtime.runOperation(
        'hr.absences.return-to-work.record',
        input.authorization,
        {
            absenceId: input.absenceId,
            returnDate: input.payload.returnDate.toISOString(),
        },
        () => recordReturnToWork(runtime.dependencies, input),
    );
}

export async function handleDeleteAbsence(
    runtime: AbsenceServiceRuntime,
    input: DeleteUnplannedAbsenceInput,
): Promise<DeleteUnplannedAbsenceResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.DELETE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId },
    });
    return runtime.runOperation(
        'hr.absences.delete',
        input.authorization,
        { absenceId: input.absenceId },
        () => deleteUnplannedAbsence(runtime.dependencies, input),
    );
}

export async function handleAcknowledgeAbsence(
    runtime: AbsenceServiceRuntime,
    input: AcknowledgeUnplannedAbsenceInput,
): Promise<AcknowledgeUnplannedAbsenceResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.ACKNOWLEDGE,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId },
    });
    return runtime.runOperation('hr.absences.acknowledge', input.authorization, { absenceId: input.absenceId }, () =>
        acknowledgeUnplannedAbsence(runtime.dependencies, input),
    );
}

export async function handleCancelAbsence(
    runtime: AbsenceServiceRuntime,
    input: CancelUnplannedAbsenceInput,
): Promise<CancelUnplannedAbsenceResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.CANCEL,
        resourceType: HR_RESOURCE.HR_ABSENCE,
        resourceAttributes: { absenceId: input.absenceId },
    });
    return runtime.runOperation('hr.absences.cancel', input.authorization, { absenceId: input.absenceId }, () =>
        cancelUnplannedAbsence(runtime.dependencies, input),
    );
}

export async function handleUpdateSettings(
    runtime: AbsenceServiceRuntime,
    input: UpdateAbsenceSettingsInput,
): Promise<UpdateAbsenceSettingsResult> {
    await runtime.ensureOrgAccess(input.authorization, {
        action: HR_ACTION.UPDATE,
        resourceType: HR_RESOURCE.HR_ABSENCE_SETTINGS,
    });
    return runtime.runOperation('hr.absences.settings.update', input.authorization, undefined, () =>
        updateAbsenceSettings(runtime.dependencies, input),
    );
}
