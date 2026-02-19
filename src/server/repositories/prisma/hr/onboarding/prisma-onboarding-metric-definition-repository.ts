import { Prisma, type PrismaClient, type OnboardingMetricDefinition as PrismaDefinition } from '@prisma/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IOnboardingMetricDefinitionRepository,
    OnboardingMetricDefinitionListFilters,
} from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import type {
    OnboardingMetricDefinitionCreateInput,
    OnboardingMetricDefinitionUpdateInput,
    OnboardingMetricDefinitionRecord,
} from '@/server/types/hr/onboarding-metrics';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapOnboardingMetricDefinitionRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/onboarding-metrics-mapper';

export class PrismaOnboardingMetricDefinitionRepository
    extends BasePrismaRepository
    implements IOnboardingMetricDefinitionRepository {
    private get definitions(): PrismaClient['onboardingMetricDefinition'] {
        return this.prisma.onboardingMetricDefinition;
    }

    private async ensureOrg(definitionId: string, orgId: string): Promise<PrismaDefinition> {
        const record = await this.definitions.findUnique({ where: { id: definitionId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Metric definition not found for this organization.');
        }
        return record;
    }

    async createDefinition(input: OnboardingMetricDefinitionCreateInput): Promise<OnboardingMetricDefinitionRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const thresholds = toPrismaInputJson(input.thresholds);
        const record = await this.definitions.create({
            data: {
                orgId: input.orgId,
                key: input.key,
                label: input.label,
                unit: input.unit ?? null,
                targetValue: input.targetValue ?? null,
                thresholds: thresholds ?? Prisma.JsonNull,
                isActive: input.isActive ?? true,
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapOnboardingMetricDefinitionRecordToDomain(record);
    }

    async updateDefinition(
        orgId: string,
        definitionId: string,
        updates: OnboardingMetricDefinitionUpdateInput,
    ): Promise<OnboardingMetricDefinitionRecord> {
        await this.ensureOrg(definitionId, orgId);
        const metadata = updates.metadata !== undefined ? toPrismaInputJson(updates.metadata) : undefined;
        const thresholds = updates.thresholds !== undefined ? toPrismaInputJson(updates.thresholds) : undefined;
        const record = await this.definitions.update({
            where: { id: definitionId },
            data: {
                label: updates.label ?? undefined,
                unit: updates.unit ?? undefined,
                targetValue: updates.targetValue ?? undefined,
                thresholds: thresholds ?? undefined,
                isActive: updates.isActive ?? undefined,
                metadata: metadata ?? undefined,
                updatedBy: updates.updatedBy ?? undefined,
                updatedAt: new Date(),
            },
        });
        return mapOnboardingMetricDefinitionRecordToDomain(record);
    }

    async getDefinition(orgId: string, definitionId: string): Promise<OnboardingMetricDefinitionRecord | null> {
        const record = await this.definitions.findUnique({ where: { id: definitionId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Metric definition access denied for this organization.');
        }
        return mapOnboardingMetricDefinitionRecordToDomain(record);
    }

    async listDefinitions(
        orgId: string,
        filters?: OnboardingMetricDefinitionListFilters,
    ): Promise<OnboardingMetricDefinitionRecord[]> {
        const recordList = await this.definitions.findMany({
            where: {
                orgId,
                isActive: filters?.isActive,
            },
            orderBy: { createdAt: 'desc' },
        });
        return recordList.map(mapOnboardingMetricDefinitionRecordToDomain);
    }
}
