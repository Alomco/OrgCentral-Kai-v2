import { Prisma, type PrismaClient, type EmailSequenceEnrollment as PrismaEmailSequenceEnrollment } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    EmailSequenceEnrollmentListFilters,
    IEmailSequenceEnrollmentRepository,
} from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type {
    EmailSequenceEnrollmentCreateInput,
    EmailSequenceEnrollmentUpdateInput,
    EmailSequenceEnrollmentRecord,
} from '@/server/types/hr/onboarding-email-sequences';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapEmailSequenceEnrollmentRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/email-sequence-mapper';

export class PrismaEmailSequenceEnrollmentRepository
    extends BasePrismaRepository
    implements IEmailSequenceEnrollmentRepository {
    private get enrollments(): PrismaClient['emailSequenceEnrollment'] {
        return this.prisma.emailSequenceEnrollment;
    }

    private async ensureOrg(enrollmentId: string, orgId: string): Promise<PrismaEmailSequenceEnrollment> {
        const record = await this.enrollments.findUnique({ where: { id: enrollmentId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Email sequence enrollment not found for this organization.');
        }
        return record;
    }

    async createEnrollment(input: EmailSequenceEnrollmentCreateInput): Promise<EmailSequenceEnrollmentRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.enrollments.create({
            data: {
                orgId: input.orgId,
                templateId: input.templateId,
                employeeId: input.employeeId ?? null,
                invitationToken: input.invitationToken ?? null,
                targetEmail: input.targetEmail,
                status: 'ACTIVE',
                startedAt: input.startedAt ?? new Date(),
                pausedAt: null,
                completedAt: null,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapEmailSequenceEnrollmentRecordToDomain(record);
    }

    async updateEnrollment(
        orgId: string,
        enrollmentId: string,
        updates: EmailSequenceEnrollmentUpdateInput,
    ): Promise<EmailSequenceEnrollmentRecord> {
        await this.ensureOrg(enrollmentId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.enrollments.update({
            where: { id: enrollmentId },
            data: {
                status: updates.status ?? undefined,
                pausedAt: updates.pausedAt ?? undefined,
                completedAt: updates.completedAt ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapEmailSequenceEnrollmentRecordToDomain(record);
    }

    async getEnrollment(orgId: string, enrollmentId: string): Promise<EmailSequenceEnrollmentRecord | null> {
        const record = await this.enrollments.findUnique({ where: { id: enrollmentId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Email sequence enrollment access denied for this organization.');
        }
        return mapEmailSequenceEnrollmentRecordToDomain(record);
    }

    async listEnrollments(
        orgId: string,
        filters?: EmailSequenceEnrollmentListFilters,
    ): Promise<EmailSequenceEnrollmentRecord[]> {
        const recordList = await this.enrollments.findMany({
            where: {
                orgId,
                employeeId: filters?.employeeId,
                invitationToken: filters?.invitationToken,
                status: filters?.status,
            },
            orderBy: { startedAt: 'desc' },
        });
        return recordList.map(mapEmailSequenceEnrollmentRecordToDomain);
    }
}
