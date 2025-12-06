import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataClassificationLevel, DataResidencyZone } from '@prisma/client';
import { okAsync } from 'neverthrow';
import type { AuditEventPayload } from '@/server/logging/audit-logger';
import { withRepositoryAuthorization, type RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
    AbsenceAttachmentDownloader,
    AbsenceDocumentAiValidator,
    AbsenceDocumentAiValidatorResult,
} from '@/server/types/absence-ai';
import type { AbsenceAttachment, AbsenceTypeConfig, UnplannedAbsence } from '@/server/types/hr-ops-types';
import type { AbsenceAiValidationResult, AbsenceAiValidationServiceDeps } from '../ai-validation.types';
import { AbsenceAiValidationService } from '../ai-validation.service';
import { AI_VALIDATION_JOB_NAME } from '../ai-validation.queue';
import { createAbsenceAiProcessor } from '../ai-validation.worker';
vi.mock('@/server/repositories/security', async () => {
    const actual = await vi.importActual<typeof import('@/server/repositories/security')>('@/server/repositories/security');
    return {
        ...actual,
        withRepositoryAuthorization: vi.fn((input: unknown, handler: (context: RepositoryAuthorizationContext) => Promise<unknown>) =>
            handler({
                orgId: (input as { orgId: string }).orgId,
                userId: (input as { userId: string }).userId,
                roleKey: 'orgAdmin',
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
vi.mock('../ai-validation.cache', async () => {
    const actual = await vi.importActual<typeof import('../ai-validation.cache')>('../ai-validation.cache');
    return {
        ...actual,
        invalidateAbsenceAiCaches: vi.fn(() => Promise.resolve()),
    };
});
const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const ABSENCE_ID = '33333333-3333-4333-8333-333333333333';
const ATTACHMENT_ID = '44444444-4444-4444-8444-444444444444';
const RETENTION_ID = '55555555-5555-4555-8555-555555555555';
const CORRELATION_ID = '66666666-6666-4666-8666-666666666666';
const ABSENCE_TYPE_ID = '77777777-7777-4777-8777-777777777777';
const DEFAULT_RESIDENCY = DataResidencyZone.UK_ONLY;
const DEFAULT_CLASSIFICATION = DataClassificationLevel.OFFICIAL;
describe('AbsenceAiValidationService', () => {
    const absenceType: AbsenceTypeConfig = {
        id: ABSENCE_TYPE_ID,
        orgId: ORG_ID,
        key: 'sickness',
        label: 'Sickness',
        tracksBalance: true,
        isActive: true,
        metadata: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    const attachment: AbsenceAttachment = {
        id: ATTACHMENT_ID,
        orgId: ORG_ID,
        absenceId: ABSENCE_ID,
        fileName: 'evidence.pdf',
        storageKey: 'secure://abs-1',
        contentType: 'application/pdf',
        fileSize: 2048,
        uploadedByUserId: USER_ID,
        uploadedAt: new Date('2024-01-01T00:00:00Z'),
        dataClassification: DEFAULT_CLASSIFICATION,
        residencyTag: DEFAULT_RESIDENCY,
        checksum: null,
        metadata: null,
    };
    const absence: UnplannedAbsence = {
        id: ABSENCE_ID,
        orgId: ORG_ID,
        userId: USER_ID,
        typeId: absenceType.id,
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-02T00:00:00Z'),
        hours: 8,
        reason: 'Sickness',
        status: 'REPORTED',
        healthStatus: null,
        approverOrgId: null,
        approverUserId: null,
        dataClassification: DEFAULT_CLASSIFICATION,
        residencyTag: DEFAULT_RESIDENCY,
        metadata: {},
        attachments: [attachment],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    let aiResult: AbsenceDocumentAiValidatorResult;
    let absenceRepository: { getAbsence: ReturnType<typeof vi.fn>; updateAbsence: ReturnType<typeof vi.fn> };
    let typeRepository: { getConfig: ReturnType<typeof vi.fn> };
    let downloader: AbsenceAttachmentDownloader;
    let validator: AbsenceDocumentAiValidator;
    let auditLogger: NonNullable<AbsenceAiValidationServiceDeps['auditLogger']>;
    let auditEvents: AuditEventPayload[];
    let service: AbsenceAiValidationService;
    const buildJobPayload = () => ({
        orgId: ORG_ID,
        absenceId: absence.id,
        attachmentId: attachment.id,
        force: true,
        authorization: {
            userId: USER_ID,
            auditSource: 'tests',
            correlationId: CORRELATION_ID,
        },
        storage: {
            storageKey: attachment.storageKey,
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            fileSize: attachment.fileSize,
            checksum: 'abc12345',
            dataResidency: DEFAULT_RESIDENCY,
            dataClassification: DEFAULT_CLASSIFICATION,
            retentionPolicyId: RETENTION_ID,
        },
    });
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
            updateAbsence: vi.fn(async (_orgId: string, _id: string, updates: { metadata: unknown }) => ({
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

        expect(absenceRepository.getAbsence).toHaveBeenCalledWith(ORG_ID, absence.id);
        expect(typeRepository.getConfig).toHaveBeenCalledWith(ORG_ID, absence.typeId);
        expect(downloader.download).toHaveBeenCalled();
        expect(validator.analyze).toHaveBeenCalled();
        expect(auditEvents).not.toHaveLength(0);
        expect(auditEvents[0]).toMatchObject({ action: 'hr.absence.ai_validation' });
        expect(absenceRepository.updateAbsence).toHaveBeenCalledWith(
            ORG_ID,
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
    const absence: UnplannedAbsence = {
        id: '88888888-8888-4888-8888-888888888888',
        orgId: ORG_ID,
        userId: USER_ID,
        typeId: 'type-1',
        startDate: new Date(),
        endDate: new Date(),
        hours: 1,
        status: 'REPORTED',
        dataClassification: DEFAULT_CLASSIFICATION,
        residencyTag: DEFAULT_RESIDENCY,
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
        metadata: null,
    };
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
