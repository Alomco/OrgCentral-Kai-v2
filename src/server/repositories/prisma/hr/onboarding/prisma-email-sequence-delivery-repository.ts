import { Prisma, type PrismaClient, type EmailSequenceDelivery as PrismaEmailSequenceDelivery } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    EmailSequenceDeliveryListFilters,
    IEmailSequenceDeliveryRepository,
} from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type {
    EmailSequenceDeliveryCreateInput,
    EmailSequenceDeliveryUpdateInput,
    EmailSequenceDeliveryRecord,
} from '@/server/types/hr/onboarding-email-sequences';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapEmailSequenceDeliveryRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/email-sequence-mapper';

export class PrismaEmailSequenceDeliveryRepository
    extends BasePrismaRepository
    implements IEmailSequenceDeliveryRepository {
    private get deliveries(): PrismaClient['emailSequenceDelivery'] {
        return this.prisma.emailSequenceDelivery;
    }

    private async ensureOrg(deliveryId: string, orgId: string): Promise<PrismaEmailSequenceDelivery> {
        const record = await this.deliveries.findUnique({ where: { id: deliveryId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Email sequence delivery not found for this organization.');
        }
        return record;
    }

    async createDelivery(input: EmailSequenceDeliveryCreateInput): Promise<EmailSequenceDeliveryRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.deliveries.create({
            data: {
                orgId: input.orgId,
                enrollmentId: input.enrollmentId,
                stepKey: input.stepKey,
                scheduledAt: input.scheduledAt,
                sentAt: null,
                status: 'QUEUED',
                provider: null,
                errorMessage: null,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapEmailSequenceDeliveryRecordToDomain(record);
    }

    async updateDelivery(
        orgId: string,
        deliveryId: string,
        updates: EmailSequenceDeliveryUpdateInput,
    ): Promise<EmailSequenceDeliveryRecord> {
        await this.ensureOrg(deliveryId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.deliveries.update({
            where: { id: deliveryId },
            data: {
                status: updates.status ?? undefined,
                sentAt: updates.sentAt ?? undefined,
                provider: updates.provider ?? undefined,
                errorMessage: updates.errorMessage ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapEmailSequenceDeliveryRecordToDomain(record);
    }

    async listDeliveries(orgId: string, filters?: EmailSequenceDeliveryListFilters): Promise<EmailSequenceDeliveryRecord[]> {
        const recordList = await this.deliveries.findMany({
            where: {
                orgId,
                enrollmentId: filters?.enrollmentId,
                status: filters?.status,
                scheduledAt: filters?.dueBefore ? { lte: filters.dueBefore } : undefined,
            },
            orderBy: { scheduledAt: 'asc' },
        });
        return recordList.map(mapEmailSequenceDeliveryRecordToDomain);
    }
}
