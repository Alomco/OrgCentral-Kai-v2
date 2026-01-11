import type { AuditEventPayload } from '@/server/logging/audit-logger';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { IUnplannedAbsenceRepository } from '@/server/repositories/contracts/hr/absences/unplanned-absence-repository-contract';
import type {
    AbsenceAttachmentDownloader,
    AbsenceDocumentAiValidator,
    AbsenceDocumentAiValidatorResult,
} from '@/server/types/absence-ai';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

export interface AbsenceAiValidationJobAuthorization {
    userId: string;
    auditSource?: string;
    correlationId?: string;
    requiredPermissions?: Record<string, string[]>;
    requiredAnyPermissions?: Record<string, string[]>[];
    expectedClassification?: DataClassificationLevel;
    expectedResidency?: DataResidencyZone;
}

export interface AbsenceAiValidationStorageMetadata {
    storageKey: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    checksum?: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    retentionPolicyId?: string;
}

export interface AbsenceAiValidationJob {
    orgId: string;
    absenceId: string;
    attachmentId?: string;
    force?: boolean;
    authorization: AbsenceAiValidationJobAuthorization;
    storage: AbsenceAiValidationStorageMetadata;
}

export interface AbsenceAiValidationResult {
    absence: UnplannedAbsence;
    aiResult: AbsenceDocumentAiValidatorResult;
    cacheTag: string;
}

export interface AbsenceAiValidationServiceDeps {
    absenceRepository: IUnplannedAbsenceRepository;
    typeConfigRepository: IAbsenceTypeConfigRepository;
    attachmentDownloader: AbsenceAttachmentDownloader;
    aiValidator: AbsenceDocumentAiValidator;
    auditLogger?: (event: AuditEventPayload) => Promise<void> | void;
    now?: () => Date;
}
