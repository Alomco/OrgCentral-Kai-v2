import { GeminiAbsenceDocumentValidator } from '@/server/lib/ai/gemini-document-validator';
import { HttpAttachmentDownloader } from '@/server/lib/storage/http-attachment-downloader';
import {
    PrismaAbsenceTypeConfigRepository,
    PrismaUnplannedAbsenceRepository,
} from '@/server/repositories/prisma/hr/absences';
import type { AbsenceAiValidationServiceDeps } from '@/server/use-cases/hr/absences/ai-validation.types';

export function buildAbsenceAiValidationDependencies(
    overrides: Partial<AbsenceAiValidationServiceDeps> = {},
): AbsenceAiValidationServiceDeps {
    return {
        absenceRepository: overrides.absenceRepository ?? new PrismaUnplannedAbsenceRepository(),
        typeConfigRepository: overrides.typeConfigRepository ?? new PrismaAbsenceTypeConfigRepository(),
        attachmentDownloader: overrides.attachmentDownloader ?? new HttpAttachmentDownloader(),
        aiValidator: overrides.aiValidator ?? new GeminiAbsenceDocumentValidator(),
        auditLogger: overrides.auditLogger,
        now: overrides.now,
    };
}
