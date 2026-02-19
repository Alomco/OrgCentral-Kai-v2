import { Prisma, type PrismaClient, type OnboardingWorkflowRun as PrismaWorkflowRun } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IOnboardingWorkflowRunRepository,
    WorkflowRunListFilters,
} from '@/server/repositories/contracts/hr/onboarding/workflow-template-repository-contract';
import type { OnboardingWorkflowRunCreateInput, OnboardingWorkflowRunUpdateInput, OnboardingWorkflowRunRecord } from '@/server/types/hr/onboarding-workflow-templates';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapWorkflowRunRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/workflow-template-mapper';

export class PrismaOnboardingWorkflowRunRepository extends BasePrismaRepository implements IOnboardingWorkflowRunRepository {
    private get runs(): PrismaClient['onboardingWorkflowRun'] {
        return this.prisma.onboardingWorkflowRun;
    }

    private async ensureOrg(runId: string, orgId: string): Promise<PrismaWorkflowRun> {
        const record = await this.runs.findUnique({ where: { id: runId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Workflow run not found for this organization.');
        }
        return record;
    }

    async createRun(input: OnboardingWorkflowRunCreateInput): Promise<OnboardingWorkflowRunRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.runs.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                templateId: input.templateId,
                offboardingId: input.offboardingId ?? null,
                status: 'IN_PROGRESS',
                currentStepKey: input.currentStepKey ?? null,
                startedAt: new Date(),
                completedAt: null,
                canceledAt: null,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapWorkflowRunRecordToDomain(record);
    }

    async updateRun(
        orgId: string,
        runId: string,
        updates: OnboardingWorkflowRunUpdateInput,
    ): Promise<OnboardingWorkflowRunRecord> {
        await this.ensureOrg(runId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const record = await this.runs.update({
            where: { id: runId },
            data: {
                status: updates.status ?? undefined,
                currentStepKey: updates.currentStepKey ?? undefined,
                completedAt: updates.completedAt ?? undefined,
                canceledAt: updates.canceledAt ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapWorkflowRunRecordToDomain(record);
    }

    async getRun(orgId: string, runId: string): Promise<OnboardingWorkflowRunRecord | null> {
        const record = await this.runs.findUnique({ where: { id: runId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Workflow run access denied for this organization.');
        }
        return mapWorkflowRunRecordToDomain(record);
    }

    async listRuns(orgId: string, filters?: WorkflowRunListFilters): Promise<OnboardingWorkflowRunRecord[]> {
        const recordList = await this.runs.findMany({
            where: {
                orgId,
                employeeId: filters?.employeeId,
                templateId: filters?.templateId,
                status: filters?.status,
            },
            orderBy: { startedAt: 'desc' },
        });
        return recordList.map(mapWorkflowRunRecordToDomain);
    }
}
