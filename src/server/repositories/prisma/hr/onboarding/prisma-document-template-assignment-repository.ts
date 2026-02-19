import { Prisma, type PrismaClient, type DocumentTemplateAssignment as PrismaAssignment } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    DocumentTemplateAssignmentListFilters,
    IDocumentTemplateAssignmentRepository,
} from '@/server/repositories/contracts/hr/onboarding/document-template-assignment-repository-contract';
import type {
    DocumentTemplateAssignmentCreateInput,
    DocumentTemplateAssignmentUpdateInput,
    DocumentTemplateAssignmentRecord,
} from '@/server/types/hr/document-template-assignments';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapDocumentTemplateAssignmentRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/document-template-assignment-mapper';

export class PrismaDocumentTemplateAssignmentRepository
    extends BasePrismaRepository
    implements IDocumentTemplateAssignmentRepository {
    private get assignments(): PrismaClient['documentTemplateAssignment'] {
        return this.prisma.documentTemplateAssignment;
    }

    private async ensureOrg(assignmentId: string, orgId: string): Promise<PrismaAssignment> {
        const record = await this.assignments.findUnique({ where: { id: assignmentId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Document assignment not found for this organization.');
        }
        return record;
    }

    async createAssignment(input: DocumentTemplateAssignmentCreateInput): Promise<DocumentTemplateAssignmentRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.assignments.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                templateId: input.templateId,
                documentId: input.documentId ?? null,
                status: input.status ?? 'PENDING',
                assignedAt: new Date(),
                completedAt: null,
                signatureProvider: input.signatureProvider ?? null,
                externalEnvelopeId: input.externalEnvelopeId ?? null,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapDocumentTemplateAssignmentRecordToDomain(record);
    }

    async updateAssignment(
        orgId: string,
        assignmentId: string,
        updates: DocumentTemplateAssignmentUpdateInput,
    ): Promise<DocumentTemplateAssignmentRecord> {
        await this.ensureOrg(assignmentId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.assignments.update({
            where: { id: assignmentId },
            data: {
                status: updates.status ?? undefined,
                documentId: updates.documentId ?? undefined,
                completedAt: updates.completedAt ?? undefined,
                signatureProvider: updates.signatureProvider ?? undefined,
                externalEnvelopeId: updates.externalEnvelopeId ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapDocumentTemplateAssignmentRecordToDomain(record);
    }

    async getAssignment(orgId: string, assignmentId: string): Promise<DocumentTemplateAssignmentRecord | null> {
        const record = await this.assignments.findUnique({ where: { id: assignmentId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Document assignment access denied for this organization.');
        }
        return mapDocumentTemplateAssignmentRecordToDomain(record);
    }

    async listAssignments(
        orgId: string,
        filters?: DocumentTemplateAssignmentListFilters,
    ): Promise<DocumentTemplateAssignmentRecord[]> {
        const recordList = await this.assignments.findMany({
            where: {
                orgId,
                employeeId: filters?.employeeId,
                templateId: filters?.templateId,
            },
            orderBy: { assignedAt: 'desc' },
        });
        return recordList.map(mapDocumentTemplateAssignmentRecordToDomain);
    }
}
