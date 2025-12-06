import { EntityNotFoundError } from '@/server/errors';
import { AbsenceAnalysisInProgressError, AbsenceAttachmentSizeError } from '@/server/errors';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { IUnplannedAbsenceRepository } from '@/server/repositories/contracts/hr/absences/unplanned-absence-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertPrivilegedOrgAbsenceActor } from '@/server/security/authorization/absences';
import type { AnalyzeAbsenceAttachmentPayload } from '@/server/types/hr-absence-schemas';
import type {
    AbsenceAttachmentDownloader,
    AbsenceDocumentAiValidator,
} from '@/server/types/absence-ai';
import {
    coerceAbsenceMetadata,
    mutateAbsenceMetadata,
    mergeMetadata,
} from '@/server/domain/absences/metadata';
import {
    assertAttachmentAnalyzable,
    MAX_ANALYSIS_BYTES,
    selectAttachment,
} from '@/server/domain/absences/attachments';
import { invalidateAbsenceScopeCache } from './cache-helpers';

export interface AnalyzeAbsenceAttachmentDependencies {
    absenceRepository: IUnplannedAbsenceRepository;
    typeConfigRepository: IAbsenceTypeConfigRepository;
    attachmentDownloader: AbsenceAttachmentDownloader;
    aiValidator: AbsenceDocumentAiValidator;
}

export interface AnalyzeAbsenceAttachmentInput {
    authorization: RepositoryAuthorizationContext;
    absenceId: string;
    payload: AnalyzeAbsenceAttachmentPayload;
    retentionPolicyId?: string;
}

export async function analyzeAbsenceAttachment(
    deps: AnalyzeAbsenceAttachmentDependencies,
    input: AnalyzeAbsenceAttachmentInput,
) {
    assertPrivilegedOrgAbsenceActor(input.authorization);

    const absence = await deps.absenceRepository.getAbsence(input.authorization.orgId, input.absenceId);
    if (!absence) {
        throw new EntityNotFoundError('Unplanned absence', { id: input.absenceId });
    }

    const attachments = absence.attachments ?? [];

    const metadata = coerceAbsenceMetadata(absence.metadata);
    if (!input.payload.force && metadata.aiValidation?.status && metadata.aiValidation.status !== 'ERROR') {
        throw new AbsenceAnalysisInProgressError({
            absenceId: input.absenceId,
            status: metadata.aiValidation.status,
        });
    }

    const attachment = selectAttachment(attachments, input.payload.attachmentId);
    assertAttachmentAnalyzable(attachment);

    const absenceType = await deps.typeConfigRepository.getConfig(input.authorization.orgId, absence.typeId);
    if (!absenceType) {
        throw new EntityNotFoundError('Absence type', { id: absence.typeId });
    }

    const downloaded = await deps.attachmentDownloader.download({
        attachment,
        orgId: input.authorization.orgId,
    });

    if (downloaded.buffer.byteLength > MAX_ANALYSIS_BYTES) {
        throw new AbsenceAttachmentSizeError(downloaded.buffer.byteLength, MAX_ANALYSIS_BYTES);
    }

    const aiResult = await deps.aiValidator.analyze({
        absence,
        absenceType,
        attachment,
        document: downloaded,
    });

    const updatedMetadata = mutateAbsenceMetadata(absence.metadata, (store) => {
        store.aiValidation = {
            status: aiResult.status,
            summary: aiResult.summary,
            issues: aiResult.issues,
            confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : undefined,
            checkedAt: new Date().toISOString(),
            attachmentId: attachment.id,
            model: aiResult.model,
            orgId: input.authorization.orgId,
            residencyTag: input.authorization.dataResidency,
            dataClassification: input.authorization.dataClassification,
            retentionPolicyId: input.retentionPolicyId,
            auditSource: input.authorization.auditSource,
            correlationId: input.authorization.correlationId,
            processedAt: new Date().toISOString(),
        };
        mergeMetadata(store, aiResult.metadata);
    });

    const updated = await deps.absenceRepository.updateAbsence(input.authorization.orgId, absence.id, {
        metadata: updatedMetadata,
    });

    await invalidateAbsenceScopeCache(input.authorization);
    return { absence: updated };
}
