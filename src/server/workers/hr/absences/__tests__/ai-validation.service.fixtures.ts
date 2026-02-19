import { DataClassificationLevel, DataResidencyZone } from '../../../../../generated/client';
import type { AbsenceAttachment, AbsenceTypeConfig, UnplannedAbsence } from '@/server/types/hr-ops-types';

export const ORG_ID = '11111111-1111-4111-8111-111111111111';
export const USER_ID = '22222222-2222-4222-8222-222222222222';
export const ABSENCE_ID = '33333333-3333-4333-8333-333333333333';
export const ATTACHMENT_ID = '44444444-4444-4444-8444-444444444444';
export const RETENTION_ID = '55555555-5555-4555-8555-555555555555';
export const CORRELATION_ID = '66666666-6666-4666-8666-666666666666';
export const ABSENCE_TYPE_ID = '77777777-7777-4777-8777-777777777777';
export const DEFAULT_RESIDENCY = DataResidencyZone.UK_ONLY;
export const DEFAULT_CLASSIFICATION = DataClassificationLevel.OFFICIAL;

export const absenceType: AbsenceTypeConfig = {
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

export const attachment: AbsenceAttachment = {
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

export const absence: UnplannedAbsence = {
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

export const processorAbsence: UnplannedAbsence = {
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

export const buildJobPayload = () => ({
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
