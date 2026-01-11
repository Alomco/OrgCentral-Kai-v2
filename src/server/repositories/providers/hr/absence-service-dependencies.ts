import { prisma as defaultPrismaClient } from '@/server/lib/prisma';
import {
    PrismaAbsenceSettingsRepository,
    PrismaAbsenceTypeConfigRepository,
    PrismaUnplannedAbsenceRepository,
} from '@/server/repositories/prisma/hr/absences';
import { PrismaLeaveBalanceRepository } from '@/server/repositories/prisma/hr/leave';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';
import { HttpAttachmentDownloader } from '@/server/lib/storage/http-attachment-downloader';
import { GeminiAbsenceDocumentValidator } from '@/server/lib/ai/gemini-document-validator';
import type { AbsenceServiceDependencies } from '@/server/services/hr/absences/absence-service';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgScopedRepositoryOptions } from '@/server/repositories/prisma/org/org-scoped-prisma-repository';
import type { AbsenceAttachmentDownloader, AbsenceDocumentAiValidator } from '@/server/types/absence-ai';

export interface AbsenceServiceDependencyOptions {
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
    overrides?: Partial<AbsenceServiceDependencies>;
}

export function buildAbsenceServiceDependencies(
    options?: AbsenceServiceDependencyOptions,
): AbsenceServiceDependencies {
    const prisma = options?.prismaOptions?.prisma ?? defaultPrismaClient;
    const repoOptions: OrgScopedRepositoryOptions = {
        prisma,
        trace: options?.prismaOptions?.trace,
        onAfterWrite: options?.prismaOptions?.onAfterWrite,
    };

    const attachmentDownloader: AbsenceAttachmentDownloader =
        options?.overrides?.attachmentDownloader ?? new HttpAttachmentDownloader();

    const aiValidator: AbsenceDocumentAiValidator =
        options?.overrides?.aiValidator ?? new GeminiAbsenceDocumentValidator();

    return {
        absenceRepository:
            options?.overrides?.absenceRepository ?? new PrismaUnplannedAbsenceRepository(repoOptions),
        typeConfigRepository:
            options?.overrides?.typeConfigRepository ?? new PrismaAbsenceTypeConfigRepository(repoOptions),
        absenceSettingsRepository:
            options?.overrides?.absenceSettingsRepository ?? new PrismaAbsenceSettingsRepository(repoOptions),
        leaveBalanceRepository:
            options?.overrides?.leaveBalanceRepository ?? new PrismaLeaveBalanceRepository(repoOptions),
        employeeProfileRepository:
            options?.overrides?.employeeProfileRepository ?? new PrismaEmployeeProfileRepository(repoOptions),
        attachmentDownloader,
        aiValidator,
    };
}
