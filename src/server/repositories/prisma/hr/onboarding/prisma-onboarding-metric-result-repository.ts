import { Prisma, type PrismaClient, type OnboardingMetricResult as PrismaResult } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IOnboardingMetricResultRepository,
    OnboardingMetricResultListFilters,
} from '@/server/repositories/contracts/hr/onboarding/onboarding-metric-repository-contract';
import type { OnboardingMetricResultCreateInput, OnboardingMetricResultRecord } from '@/server/types/hr/onboarding-metrics';
import { RepositoryAuthorizationError } from '@/server/repositories/security';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapOnboardingMetricResultRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/onboarding-metrics-mapper';

export class PrismaOnboardingMetricResultRepository extends BasePrismaRepository implements IOnboardingMetricResultRepository {
    private get results(): PrismaClient['onboardingMetricResult'] {
        return this.prisma.onboardingMetricResult;
    }

    private async ensureOrg(resultId: string, orgId: string): Promise<PrismaResult> {
        const record = await this.results.findUnique({ where: { id: resultId } });
        if (!record || (record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Metric result not found for this organization.');
        }
        return record;
    }

    async createResult(input: OnboardingMetricResultCreateInput): Promise<OnboardingMetricResultRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.results.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                metricId: input.metricId,
                value: input.value ?? null,
                valueText: input.valueText ?? null,
                source: input.source ?? 'SYSTEM',
                measuredAt: input.measuredAt ?? new Date(),
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapOnboardingMetricResultRecordToDomain(record);
    }

    async listResults(orgId: string, filters?: OnboardingMetricResultListFilters): Promise<OnboardingMetricResultRecord[]> {
        if (filters?.employeeId || filters?.metricId) {
            const recordList = await this.results.findMany({
                where: {
                    orgId,
                    employeeId: filters.employeeId,
                    metricId: filters.metricId,
                },
                orderBy: { measuredAt: 'desc' },
            });
            return recordList.map(mapOnboardingMetricResultRecordToDomain);
        }
        const recordList = await this.results.findMany({
            where: { orgId },
            orderBy: { measuredAt: 'desc' },
            take: 200,
        });
        return recordList.map(mapOnboardingMetricResultRecordToDomain);
    }

    async getResult(orgId: string, resultId: string): Promise<OnboardingMetricResultRecord | null> {
        const record = await this.results.findUnique({ where: { id: resultId } });
        if (!record) {
            return null;
        }
        if ((record as { orgId?: string }).orgId !== orgId) {
            throw new RepositoryAuthorizationError('Metric result access denied for this organization.');
        }
        return mapOnboardingMetricResultRecordToDomain(record);
    }
}
