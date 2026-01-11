import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceAttachmentDownloader, AbsenceDocumentAiValidatorResult } from '@/server/types/absence-ai';
import type { AbsenceAttachment, AbsenceTypeConfig, UnplannedAbsence } from '@/server/types/hr-ops-types';
import { ValidationError, EntityNotFoundError } from '@/server/errors';
import { AbsenceAttachmentSizeError } from '@/server/errors/hr-absences';
import { mutateAbsenceMetadata, mergeMetadata } from '@/server/domain/absences/metadata';
import { selectAttachment, assertAttachmentAnalyzable, MAX_ANALYSIS_BYTES } from '@/server/domain/absences/attachments';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { buildAbsenceCacheTag, invalidateAbsenceAiCaches } from '@/server/use-cases/hr/absences/ai-validation.cache';
import type {
    AbsenceAiValidationJob,
    AbsenceAiValidationResult,
    AbsenceAiValidationServiceDeps,
} from '@/server/use-cases/hr/absences/ai-validation.types';

const toError = (
    error: Error | string | { message?: string } | null | undefined,
): Error => {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === 'string') {
        return new Error(error);
    }
    if (error && typeof error === 'object' && typeof error.message === 'string') {
        return new Error(error.message);
    }
    return new Error('Unknown error');
};

export class AbsenceAiValidationProcessor {
    private readonly deps: Required<Omit<AbsenceAiValidationServiceDeps, 'auditLogger' | 'now'>> & {
        auditLogger: Required<AbsenceAiValidationServiceDeps>['auditLogger'];
        now: Required<AbsenceAiValidationServiceDeps>['now'];
    };

    constructor(deps: AbsenceAiValidationServiceDeps) {
        this.deps = {
            ...deps,
            auditLogger: deps.auditLogger ?? recordAuditEvent,
            now: deps.now ?? (() => new Date()),
        };
    }

    process(
        parsed: AbsenceAiValidationJob,
        authorization: RepositoryAuthorizationContext,
    ): ResultAsync<AbsenceAiValidationResult, Error> {
        return this.loadAbsence(parsed, authorization)
            .andThen((absence) => this.verifyAttachment(absence, parsed))
            .andThen(({ absence, attachment }) =>
                this.loadType(absence, parsed).map((absenceType) => ({ absence, attachment, absenceType })),
            )
            .andThen(({ absence, attachment, absenceType }) =>
                this.fetchAttachment(attachment, authorization).map((document) => ({
                    absence,
                    attachment,
                    absenceType,
                    document,
                })),
            )
            .andThen(({ absence, attachment, absenceType, document }) =>
                this.runAi(absence, attachment, absenceType, document).map((aiResult) => ({
                    absence,
                    attachment,
                    aiResult,
                })),
            )
            .andThen(({ absence, attachment, aiResult }) =>
                this.persist(absence, attachment, aiResult, parsed, authorization),
            )
            .andThen((result) =>
                ResultAsync.fromPromise(
                    invalidateAbsenceAiCaches(result.authorization),
                    (error) => toError(error as Error | string | { message?: string } | null | undefined),
                ).map(() => result),
            )
            .map(({ absence, aiResult, authorization: auth }) => ({
                absence,
                aiResult,
                cacheTag: buildAbsenceCacheTag(auth),
            }));
    }

    private loadAbsence(
        parsed: AbsenceAiValidationJob,
        authorization: RepositoryAuthorizationContext,
    ): ResultAsync<UnplannedAbsence, Error> {
        return ResultAsync.fromPromise<UnplannedAbsence | null, Error>(
            this.deps.absenceRepository.getAbsence(authorization.orgId, parsed.absenceId),
            (error) => toError(error as Error | string | { message?: string } | null | undefined),
        ).andThen((absence) => {
            if (!absence) {
                return errAsync(new EntityNotFoundError('Unplanned absence', { id: parsed.absenceId }));
            }
            if (
                absence.dataClassification !== parsed.storage.dataClassification ||
                absence.residencyTag !== parsed.storage.dataResidency
            ) {
                return errAsync(
                    new ValidationError('Storage metadata does not match absence classification or residency.'),
                );
            }
            return okAsync(absence);
        });
    }

    private verifyAttachment(
        absence: UnplannedAbsence,
        parsed: AbsenceAiValidationJob,
    ): ResultAsync<{ absence: UnplannedAbsence; attachment: AbsenceAttachment }, Error> {
        const attachments = absence.attachments ?? [];
        try {
            const attachment: AbsenceAttachment = selectAttachment(attachments, parsed.attachmentId);
            if (parsed.storage.fileSize > MAX_ANALYSIS_BYTES) {
                return errAsync(new AbsenceAttachmentSizeError(parsed.storage.fileSize, MAX_ANALYSIS_BYTES));
            }
            if (attachment.storageKey !== parsed.storage.storageKey) {
                return errAsync(new ValidationError('Attachment storage key mismatch.'));
            }
            assertAttachmentAnalyzable(attachment);
            return okAsync({ absence, attachment });
        } catch (error) {
            return errAsync(toError(error as Error | string | { message?: string } | null | undefined));
        }
    }

    private loadType(absence: UnplannedAbsence, parsed: AbsenceAiValidationJob) {
        return ResultAsync.fromPromise<AbsenceTypeConfig | null, Error>(
            this.deps.typeConfigRepository.getConfig(parsed.orgId, absence.typeId),
            (error) => toError(error as Error | string | { message?: string } | null | undefined),
        ).andThen((type) => {
            if (!type) {
                return errAsync(new EntityNotFoundError('Absence type', { id: absence.typeId }));
            }
            return okAsync(type);
        });
    }

    private fetchAttachment(
        attachment: AbsenceAttachment,
        authorization: RepositoryAuthorizationContext,
    ) {
        return ResultAsync.fromPromise<Awaited<ReturnType<AbsenceAttachmentDownloader['download']>>, Error>(
            this.deps.attachmentDownloader.download({
                attachment,
                orgId: authorization.orgId,
            }),
            (error) => toError(error as Error | string | { message?: string } | null | undefined),
        ).andThen((document) => {
            if (document.buffer.byteLength > MAX_ANALYSIS_BYTES) {
                return errAsync(new AbsenceAttachmentSizeError(document.buffer.byteLength, MAX_ANALYSIS_BYTES));
            }
            return okAsync(document);
        });
    }

    private runAi(
        absence: UnplannedAbsence,
        attachment: AbsenceAttachment,
        absenceType: AbsenceTypeConfig,
        document: Awaited<ReturnType<AbsenceAttachmentDownloader['download']>>,
    ) {
        return ResultAsync.fromPromise<AbsenceDocumentAiValidatorResult, Error>(
            this.deps.aiValidator.analyze({
                absence,
                absenceType,
                attachment,
                document,
            }),
            (error) => toError(error as Error | string | { message?: string } | null | undefined),
        );
    }

    private persist(
        absence: UnplannedAbsence,
        attachment: AbsenceAttachment,
        aiResult: AbsenceDocumentAiValidatorResult,
        parsed: AbsenceAiValidationJob,
        authorization: RepositoryAuthorizationContext,
    ): ResultAsync<{
        absence: UnplannedAbsence;
        aiResult: AbsenceDocumentAiValidatorResult;
        authorization: RepositoryAuthorizationContext;
    }, Error> {
        const updatedMetadata = mutateAbsenceMetadata(absence.metadata, (store) => {
            const aiMetadata = store.aiValidation ? { ...store.aiValidation } : {};
            store.aiValidation = {
                ...aiMetadata,
                status: aiResult.status,
                summary: aiResult.summary,
                issues: aiResult.issues,
                confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : undefined,
                checkedAt: this.deps.now().toISOString(),
                attachmentId: attachment.id,
                model: aiResult.model,
                orgId: authorization.orgId,
                residencyTag: authorization.dataResidency,
                dataClassification: authorization.dataClassification,
                retentionPolicyId: parsed.storage.retentionPolicyId,
                auditSource: authorization.auditSource,
                correlationId: authorization.correlationId,
                processedAt: this.deps.now().toISOString(),
            };
            mergeMetadata(store, aiResult.metadata);
        });

        return ResultAsync.fromPromise<UnplannedAbsence, Error>(
            this.deps.absenceRepository.updateAbsence(authorization.orgId, absence.id, {
                metadata: updatedMetadata,
            }),
            (error) => toError(error as Error | string | { message?: string } | null | undefined),
        ).andThen((updated) =>
            ResultAsync.fromPromise(
                Promise.resolve(
                    this.deps.auditLogger({
                        orgId: authorization.orgId,
                        userId: authorization.userId,
                        eventType: 'DATA_CHANGE',
                        action: 'hr.absence.ai_validation',
                        resource: 'hr.absence',
                        resourceId: updated.id,
                        correlationId: authorization.correlationId,
                        residencyZone: authorization.dataResidency,
                        classification: authorization.dataClassification,
                        auditSource: authorization.auditSource,
                        payload: {
                            status: aiResult.status,
                            issues: aiResult.issues,
                            attachmentId: attachment.id,
                            retentionPolicyId: parsed.storage.retentionPolicyId ?? null,
                            storageKey: attachment.storageKey,
                        },
                    }),
                ),
                (error) => toError(error as Error | string | { message?: string } | null | undefined),
            ).map(() => ({
                absence: updated,
                aiResult,
                authorization,
            })),
        );
    }
}
