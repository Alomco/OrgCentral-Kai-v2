import { Prisma, type PrismaClient, type MentorAssignment as PrismaMentorAssignment } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IMentorAssignmentRepository,
    MentorAssignmentListFilters,
} from '@/server/repositories/contracts/hr/onboarding/mentor-assignment-repository-contract';
import type { MentorAssignmentCreateInput, MentorAssignmentUpdateInput, MentorAssignmentRecord } from '@/server/types/hr/mentor-assignments';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapMentorAssignmentRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/mentor-assignment-mapper';

export class PrismaMentorAssignmentRepository extends BasePrismaRepository implements IMentorAssignmentRepository {
    private get assignments(): PrismaClient['mentorAssignment'] {
        return this.prisma.mentorAssignment;
    }

    private async ensureOrg(assignmentId: string, orgId: string): Promise<PrismaMentorAssignment> {
        const record = await this.assignments.findUnique({ where: { id: assignmentId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Mentor assignment not found for this organization.');
        }
        return record;
    }

    async createAssignment(input: MentorAssignmentCreateInput): Promise<MentorAssignmentRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.assignments.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                mentorOrgId: input.mentorOrgId,
                mentorUserId: input.mentorUserId,
                status: 'ACTIVE',
                assignedAt: new Date(),
                endedAt: null,
                reason: input.reason ?? null,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapMentorAssignmentRecordToDomain(record);
    }

    async updateAssignment(
        orgId: string,
        assignmentId: string,
        updates: MentorAssignmentUpdateInput,
    ): Promise<MentorAssignmentRecord> {
        await this.ensureOrg(assignmentId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.assignments.update({
            where: { id: assignmentId },
            data: {
                status: updates.status,
                endedAt: updates.endedAt ?? undefined,
                reason: updates.reason ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapMentorAssignmentRecordToDomain(record);
    }

    async getAssignment(orgId: string, assignmentId: string): Promise<MentorAssignmentRecord | null> {
        const record = await this.assignments.findUnique({ where: { id: assignmentId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Mentor assignment access denied for this organization.');
        }
        return mapMentorAssignmentRecordToDomain(record);
    }

    async listAssignments(orgId: string, filters?: MentorAssignmentListFilters): Promise<MentorAssignmentRecord[]> {
        const recordList = await this.assignments.findMany({
            where: {
                orgId,
                employeeId: filters?.employeeId,
                mentorUserId: filters?.mentorUserId,
                status: filters?.status,
            },
            orderBy: { assignedAt: 'desc' },
        });
        return recordList.map(mapMentorAssignmentRecordToDomain);
    }
}
