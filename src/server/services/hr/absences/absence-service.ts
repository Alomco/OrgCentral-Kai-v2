import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { AbstractHrService } from '@/server/services/hr/abstract-hr-service';
import type { AcknowledgeUnplannedAbsenceDependencies, AcknowledgeUnplannedAbsenceInput, AcknowledgeUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/acknowledge-unplanned-absence';
import type { AddAbsenceAttachmentsDependencies, AddAbsenceAttachmentsInput, AddAbsenceAttachmentsResult } from '@/server/use-cases/hr/absences/add-absence-attachments';
import type { CancelUnplannedAbsenceDependencies, CancelUnplannedAbsenceInput, CancelUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/cancel-unplanned-absence';
import type { RemoveAbsenceAttachmentDependencies, RemoveAbsenceAttachmentInput, RemoveAbsenceAttachmentResult } from '@/server/use-cases/hr/absences/remove-absence-attachment';
import type { ReportUnplannedAbsenceDependencies, ReportUnplannedAbsenceInput, ReportUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/report-unplanned-absence';
import type { ApproveUnplannedAbsenceDependencies, ApproveUnplannedAbsenceInput, ApproveUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/approve-unplanned-absence';
import type { UpdateUnplannedAbsenceDependencies, UpdateUnplannedAbsenceInput, UpdateUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/update-unplanned-absence';
import type { RecordReturnToWorkDependencies, RecordReturnToWorkInput, RecordReturnToWorkResult } from '@/server/use-cases/hr/absences/record-return-to-work';
import type { DeleteUnplannedAbsenceDependencies, DeleteUnplannedAbsenceInput, DeleteUnplannedAbsenceResult } from '@/server/use-cases/hr/absences/delete-unplanned-absence';
import type { GetAbsencesDependencies, GetAbsencesInput, GetAbsencesResult } from '@/server/use-cases/hr/absences/get-absences';
import type { UpdateAbsenceSettingsDependencies, UpdateAbsenceSettingsInput, UpdateAbsenceSettingsResult } from '@/server/use-cases/hr/absences/update-absence-settings';
import type { AnalyzeAbsenceAttachmentDependencies, AnalyzeAbsenceAttachmentInput } from '@/server/use-cases/hr/absences/analyze-absence-attachment';
import {
    handleAcknowledgeAbsence,
    handleAddAttachments,
    handleAnalyzeAttachment,
    handleApproveAbsence,
    handleCancelAbsence,
    handleDeleteAbsence,
    handleListAbsences,
    handleRecordReturnToWork,
    handleRemoveAttachment,
    handleReportAbsence,
    handleUpdateAbsence,
    handleUpdateSettings,
    type AbsenceServiceRuntime,
} from './absence-service.operations';

export type AbsenceServiceDependencies = AcknowledgeUnplannedAbsenceDependencies &
    AddAbsenceAttachmentsDependencies &
    ApproveUnplannedAbsenceDependencies &
    CancelUnplannedAbsenceDependencies &
    DeleteUnplannedAbsenceDependencies &
    GetAbsencesDependencies &
    RecordReturnToWorkDependencies &
    RemoveAbsenceAttachmentDependencies &
    ReportUnplannedAbsenceDependencies &
    UpdateAbsenceSettingsDependencies &
    UpdateUnplannedAbsenceDependencies &
    AnalyzeAbsenceAttachmentDependencies;

export class AbsenceService extends AbstractHrService {
    private readonly runtime: AbsenceServiceRuntime;

    constructor(private readonly dependencies: AbsenceServiceDependencies) {
        super();
        this.runtime = {
            dependencies: this.dependencies,
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            runOperation: this.runOperation.bind(this),
        };
    }

    async listAbsences(input: GetAbsencesInput): Promise<GetAbsencesResult> {
        return handleListAbsences(this.runtime, input);
    }

    async reportAbsence(input: ReportUnplannedAbsenceInput): Promise<ReportUnplannedAbsenceResult> {
        return handleReportAbsence(this.runtime, input);
    }

    async approveAbsence(input: ApproveUnplannedAbsenceInput): Promise<ApproveUnplannedAbsenceResult> {
        return handleApproveAbsence(this.runtime, input);
    }

    async updateAbsence(input: UpdateUnplannedAbsenceInput): Promise<UpdateUnplannedAbsenceResult> {
        return handleUpdateAbsence(this.runtime, input);
    }

    async addAttachments(input: AddAbsenceAttachmentsInput): Promise<AddAbsenceAttachmentsResult> {
        return handleAddAttachments(this.runtime, input);
    }

    async removeAttachment(
        input: RemoveAbsenceAttachmentInput,
    ): Promise<RemoveAbsenceAttachmentResult> {
        return handleRemoveAttachment(this.runtime, input);
    }

    async recordReturnToWork(input: RecordReturnToWorkInput): Promise<RecordReturnToWorkResult> {
        return handleRecordReturnToWork(this.runtime, input);
    }

    async deleteAbsence(input: DeleteUnplannedAbsenceInput): Promise<DeleteUnplannedAbsenceResult> {
        return handleDeleteAbsence(this.runtime, input);
    }

    async acknowledgeAbsence(input: AcknowledgeUnplannedAbsenceInput): Promise<AcknowledgeUnplannedAbsenceResult> {
        return handleAcknowledgeAbsence(this.runtime, input);
    }

    async cancelAbsence(input: CancelUnplannedAbsenceInput): Promise<CancelUnplannedAbsenceResult> {
        return handleCancelAbsence(this.runtime, input);
    }

    async updateSettings(input: UpdateAbsenceSettingsInput): Promise<UpdateAbsenceSettingsResult> {
        return handleUpdateSettings(this.runtime, input);
    }

    async analyzeAttachment(input: AnalyzeAbsenceAttachmentInput) {
        return handleAnalyzeAttachment(this.runtime, input);
    }

    private runOperation<TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ): Promise<TResult> {
        const context: ServiceExecutionContext = this.buildContext(authorization, { metadata });
        return this.executeInServiceContext(context, operation, handler);
    }
}
