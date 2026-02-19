import { DataClassificationLevel, DataResidencyZone } from '../../../../../generated/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { okAsync } from 'neverthrow';
import type { AuditEventPayload } from '@/server/logging/audit-logger';
import { withRepositoryAuthorization, type RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
    AbsenceAttachmentDownloader,
    AbsenceDocumentAiValidator,
    AbsenceDocumentAiValidatorResult,
} from '@/server/types/absence-ai';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import type { AbsenceAiValidationResult, AbsenceAiValidationServiceDeps } from '../ai-validation.types';
import { AbsenceAiValidationService } from '../ai-validation.service';
import { AI_VALIDATION_JOB_NAME } from '../ai-validation.queue';
import { createAbsenceAiProcessor } from '../ai-validation.worker';
import {
    ABSENCE_ID,
    DEFAULT_CLASSIFICATION,
    DEFAULT_RESIDENCY,
    ORG_ID,
    RETENTION_ID,
    USER_ID,
    absence,
    absenceType,
    buildJobPayload,
    processorAbsence,
} from './ai-validation.service.fixtures';
vi.mock('@/server/repositories/security', async () => {
    const actual = await vi.importActual<typeof import('@/server/repositories/security')>('@/server/repositories/security');
    return {
        ...actual,
        withRepositoryAuthorization: vi.fn((input: unknown, handler: (context: RepositoryAuthorizationContext) => Promise<unknown>) =>
            handler({
                orgId: (input as { orgId: string }).orgId,
                userId: (input as { userId: string }).userId,
                roleKey: 'orgAdmin',
                permissions: {},
                dataResidency:
                    (input as { expectedResidency?: DataResidencyZone }).expectedResidency ?? DEFAULT_RESIDENCY,
                dataClassification:
                    (input as { expectedClassification?: DataClassificationLevel }).expectedClassification ??
                    DEFAULT_CLASSIFICATION,
                auditSource: (input as { auditSource?: string }).auditSource ?? 'test-audit',
                correlationId: (input as { correlationId?: string }).correlationId ?? 'corr-123',
                tenantScope: {
                    orgId: (input as { orgId: string }).orgId,
                    dataResidency:
                        (input as { expectedResidency?: DataResidencyZone }).expectedResidency ?? DEFAULT_RESIDENCY,
                    dataClassification:
                        (input as { expectedClassification?: DataClassificationLevel }).expectedClassification ??
                        DEFAULT_CLASSIFICATION,
                    auditSource: (input as { auditSource?: string }).auditSource ?? 'test-audit',
                },
            } satisfies RepositoryAuthorizationContext),
        ),
    };
});
vi.mock('@/server/use-cases/hr/absences/ai-validation.cache', async () => {
    const actual = await vi.importActual<typeof import('@/server/use-cases/hr/absences/ai-validation.cache')>(
        '@/server/use-cases/hr/absences/ai-validation.cache',
    );
    return {
        ...actual,
        invalidateAbsenceAiCaches: vi.fn(() => Promise.resolve()),
    };
});
describe('AbsenceAiValidationService', () => {
    let aiResult: AbsenceDocumentAiValidatorResult;
    let absenceRepository: { getAbsence: ReturnType<typeof vi.fn>; updateAbsence: ReturnType<typeof vi.fn> };
    let typeRepository: { getConfig: ReturnType<typeof vi.fn> };
    let downloader: AbsenceAttachmentDownloader;
    let validator: AbsenceDocumentAiValidator;
    let auditLogger: NonNullable<AbsenceAiValidationServiceDeps['auditLogger']>;
    let auditEvents: AuditEventPayload[];
    let service: AbsenceAiValidationService;
    beforeEach(() => {
        vi.clearAllMocks();
        aiResult = {
            status: 'VERIFIED',
            summary: 'matches',
            issues: [],
            confidence: 0.92,
            metadata: { source: 'unit-test' },
            model: 'gemini',
        };
        absenceRepository = {
            getAbsence: vi.fn(async () => absence),
            updateAbsence: vi.fn(async (_authorization: RepositoryAuthorizationContext, _id: string, updates: { metadata: unknown }) => ({
                ...absence,
                metadata: updates.metadata,
            })),
        };
        typeRepository = {
            getConfig: vi.fn(async () => absenceType),
        };
        downloader = {
            download: vi.fn(async () => ({
                buffer: Buffer.from('file'),
                contentType: 'application/pdf',
                fileName: 'evidence.pdf',
            })),
        };
        validator = {
            analyze: vi.fn(async () => aiResult),
        };
        auditEvents = [];
        auditLogger = async (event) => {
            auditEvents.push(event);
        };
        service = new AbsenceAiValidationService({
            absenceRepository: absenceRepository as never,
            typeConfigRepository: typeRepository as never,
            attachmentDownloader: downloader,
            aiValidator: validator,
            auditLogger,
            now: () => new Date('2024-02-01T00:00:00Z'),
        });
    });
    it('persists AI validation metadata and audits', async () => {
        const payload = buildJobPayload();

        const outcome = await service.handle(payload).match(
            (value) => value,
            (error) => {
                throw error;
            },
        );

        expect(absenceRepository.getAbsence).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: ORG_ID }),
            absence.id,
        );
        expect(typeRepository.getConfig).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: ORG_ID }),
            absence.typeId,
        );
        expect(downloader.download).toHaveBeenCalled();
        expect(validator.analyze).toHaveBeenCalled();
        expect(auditEvents).not.toHaveLength(0);
        expect(auditEvents[0]).toMatchObject({ action: 'hr.absence.ai_validation' });
        expect(absenceRepository.updateAbsence).toHaveBeenCalledWith(
            expect.objectContaining({ orgId: ORG_ID }),
            absence.id,
            expect.objectContaining({
                metadata: expect.objectContaining({
                    aiValidation: expect.objectContaining({
                        status: 'VERIFIED',
                        retentionPolicyId: RETENTION_ID,
                        residencyTag: DEFAULT_RESIDENCY,
                    }),
                }),
            }),
        );
        expect(outcome.cacheTag).toBe(
            `org:${ORG_ID}:hr-absences:${DEFAULT_RESIDENCY}:${DEFAULT_CLASSIFICATION}`,
        );
    });
    it('rejects invalid job payloads', async () => {
        const error = await service.handle({}).match(
            () => Promise.reject(new Error('expected failure')),
            (err) => Promise.resolve(err),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('orgId');
    });

    it('stops when authorization guard fails', async () => {
        vi.mocked(withRepositoryAuthorization).mockRejectedValueOnce(new Error('forbidden'));
        const payload = buildJobPayload();

        const error = await service.handle(payload).match(
            () => Promise.reject(new Error('expected failure')),
            (err) => Promise.resolve(err),
        );

        expect(withRepositoryAuthorization).toHaveBeenCalled();
        expect(absenceRepository.getAbsence).not.toHaveBeenCalled();
        expect(error.message).toContain('forbidden');
    });
});

describe('createAbsenceAiProcessor', () => {
    const absence: UnplannedAbsence = processorAbsence;
    const serviceHandleMock = vi.fn(() =>
        okAsync<AbsenceAiValidationResult, Error>({
            absence,
            aiResult: { status: 'VERIFIED', issues: [], summary: 'ok' },
            cacheTag: 'org:tag',
        }),
    );
    const service: Pick<AbsenceAiValidationService, 'handle'> = {
        handle: serviceHandleMock as unknown as AbsenceAiValidationService['handle'],
    };

    it('invokes service and returns result', async () => {
        const processor = createAbsenceAiProcessor(service);
        const result = await processor({ data: { foo: 'bar' }, name: AI_VALIDATION_JOB_NAME });
        expect(serviceHandleMock).toHaveBeenCalledWith({ foo: 'bar' });
        expect(result.cacheTag).toBe('org:tag');
    });

    it('throws for unsupported job name', async () => {
        const processor = createAbsenceAiProcessor(service);
        await expect(processor({ data: {}, name: 'other-job' })).rejects.toThrow('Unsupported job received');
    });
});
