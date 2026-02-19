import { Prisma, type PrismaClient, type ProvisioningTask as PrismaProvisioningTask } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IProvisioningTaskRepository,
    ProvisioningTaskListFilters,
} from '@/server/repositories/contracts/hr/onboarding/provisioning-task-repository-contract';
import type { ProvisioningTaskCreateInput, ProvisioningTaskUpdateInput, ProvisioningTaskRecord } from '@/server/types/hr/provisioning-tasks';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapProvisioningTaskRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/provisioning-task-mapper';

export class PrismaProvisioningTaskRepository extends BasePrismaRepository implements IProvisioningTaskRepository {
    private get tasks(): PrismaClient['provisioningTask'] {
        return this.prisma.provisioningTask;
    }

    private async ensureOrg(taskId: string, orgId: string): Promise<PrismaProvisioningTask> {
        const record = await this.tasks.findUnique({ where: { id: taskId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Provisioning task not found for this organization.');
        }
        return record;
    }

    async createTask(input: ProvisioningTaskCreateInput): Promise<ProvisioningTaskRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.tasks.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                requestedByUserId: input.requestedByUserId,
                offboardingId: input.offboardingId ?? null,
                taskType: input.taskType,
                status: 'PENDING',
                systemKey: input.systemKey ?? null,
                accountIdentifier: input.accountIdentifier ?? null,
                assetTag: input.assetTag ?? null,
                accessLevel: input.accessLevel ?? null,
                instructions: input.instructions ?? null,
                dueAt: input.dueAt ?? null,
                completedAt: null,
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
        return mapProvisioningTaskRecordToDomain(record);
    }

    async updateTask(
        orgId: string,
        taskId: string,
        updates: ProvisioningTaskUpdateInput,
    ): Promise<ProvisioningTaskRecord> {
        await this.ensureOrg(taskId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.tasks.update({
            where: { id: taskId },
            data: {
                status: updates.status,
                systemKey: updates.systemKey ?? undefined,
                accountIdentifier: updates.accountIdentifier ?? undefined,
                assetTag: updates.assetTag ?? undefined,
                accessLevel: updates.accessLevel ?? undefined,
                instructions: updates.instructions ?? undefined,
                dueAt: updates.dueAt ?? undefined,
                completedAt: updates.completedAt ?? undefined,
                errorMessage: updates.errorMessage ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapProvisioningTaskRecordToDomain(record);
    }

    async getTask(orgId: string, taskId: string): Promise<ProvisioningTaskRecord | null> {
        const record = await this.tasks.findUnique({ where: { id: taskId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Provisioning task access denied for this organization.');
        }
        return mapProvisioningTaskRecordToDomain(record);
    }

    async listTasks(orgId: string, filters?: ProvisioningTaskListFilters): Promise<ProvisioningTaskRecord[]> {
        const recordList = await this.tasks.findMany({
            where: {
                orgId,
                employeeId: filters?.employeeId,
                offboardingId: filters?.offboardingId,
                status: filters?.status,
            },
            orderBy: { createdAt: 'desc' },
        });
        return recordList.map(mapProvisioningTaskRecordToDomain);
    }
}
