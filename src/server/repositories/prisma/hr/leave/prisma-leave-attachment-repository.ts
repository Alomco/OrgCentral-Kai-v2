import { Prisma } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { ILeaveAttachmentRepository } from '@/server/repositories/contracts/hr/leave/leave-attachment-repository-contract';
import type { LeaveAttachment, LeaveAttachmentInput } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';
import { EntityNotFoundError } from '@/server/errors';
import { mapLeaveAttachmentFromPrisma } from '@/server/repositories/mappers/hr/leave/leave-attachment-mapper';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_LEAVE_REQUESTS } from '@/server/repositories/cache-scopes';

export class PrismaLeaveAttachmentRepository extends BasePrismaRepository implements ILeaveAttachmentRepository {
    async addAttachments(tenant: TenantScope, requestId: string, attachments: LeaveAttachmentInput[]): Promise<void> {
        const { orgId } = tenant;

        await this.prisma.leaveRequest.findFirstOrThrow({ where: { id: requestId, orgId } });

        await this.prisma.leaveAttachment.createMany({
            data: attachments.map((attachment) => ({
                orgId,
                requestId,
                fileName: attachment.fileName,
                storageKey: attachment.storageKey,
                contentType: attachment.contentType,
                fileSize: attachment.fileSize,
                checksum: attachment.checksum ?? null,
                uploadedByUserId: attachment.uploadedByUserId,
                uploadedAt: attachment.uploadedAt ? new Date(attachment.uploadedAt) : new Date(),
                dataClassification: tenant.dataClassification,
                residencyTag: tenant.dataResidency,
                auditSource: tenant.auditSource,
                auditBatchId: tenant.auditBatchId,
                metadata: attachment.metadata !== undefined
                    ? attachment.metadata === null
                        ? Prisma.DbNull
                        : (attachment.metadata as Prisma.InputJsonValue)
                    : undefined,
            })),
        });

        await invalidateOrgCache(orgId, CACHE_SCOPE_LEAVE_REQUESTS, tenant.dataClassification, tenant.dataResidency);
    }

    async listAttachments(tenant: TenantScope, requestId: string): Promise<LeaveAttachment[]> {
        const { orgId } = tenant;
        const records = await this.prisma.leaveAttachment.findMany({
            where: { orgId, requestId },
            orderBy: { uploadedAt: 'desc' },
        });
        return records.map(mapLeaveAttachmentFromPrisma);
    }

    async getAttachment(tenant: TenantScope, attachmentId: string): Promise<LeaveAttachment | null> {
        const { orgId } = tenant;
        const record = await this.prisma.leaveAttachment.findUnique({ where: { id: attachmentId } });
        if (record?.orgId !== orgId) {
            return null;
        }
        return mapLeaveAttachmentFromPrisma(record);
    }

    async deleteAttachment(tenant: TenantScope, attachmentId: string): Promise<void> {
        const { orgId } = tenant;
        const existing = await this.prisma.leaveAttachment.findUnique({ where: { id: attachmentId } });
        if (existing?.orgId !== orgId) {
            throw new EntityNotFoundError('Leave attachment', { attachmentId, orgId });
        }

        await this.prisma.leaveAttachment.delete({ where: { id: attachmentId } });
        await invalidateOrgCache(orgId, CACHE_SCOPE_LEAVE_REQUESTS, tenant.dataClassification, tenant.dataResidency);
    }
}
