import { Prisma, type PrismaClient } from '../../../../../generated/client';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    IOnboardingFeedbackRepository,
    OnboardingFeedbackListFilters,
} from '@/server/repositories/contracts/hr/onboarding/onboarding-feedback-repository-contract';
import type { OnboardingFeedbackCreateInput, OnboardingFeedbackRecord } from '@/server/types/hr/onboarding-feedback';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { mapOnboardingFeedbackRecordToDomain } from '@/server/repositories/mappers/hr/onboarding/onboarding-feedback-mapper';

export class PrismaOnboardingFeedbackRepository extends BasePrismaRepository implements IOnboardingFeedbackRepository {
    private get feedback(): PrismaClient['onboardingFeedback'] {
        return this.prisma.onboardingFeedback;
    }

    async createFeedback(input: OnboardingFeedbackCreateInput): Promise<OnboardingFeedbackRecord> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.feedback.create({
            data: {
                orgId: input.orgId,
                employeeId: input.employeeId,
                rating: input.rating,
                summary: input.summary ?? null,
                comments: input.comments ?? null,
                submittedAt: new Date(),
                metadata: metadata ?? Prisma.JsonNull,
                dataClassification: input.dataClassification,
                residencyTag: input.residencyTag,
                auditSource: input.auditSource ?? null,
                correlationId: input.correlationId ?? null,
                createdBy: input.createdBy ?? null,
                updatedBy: null,
            },
        });
        return mapOnboardingFeedbackRecordToDomain(record);
    }

    async listFeedback(orgId: string, filters?: OnboardingFeedbackListFilters): Promise<OnboardingFeedbackRecord[]> {
        const recordList = await this.feedback.findMany({
            where: {
                orgId,
                employeeId: filters?.employeeId,
            },
            orderBy: { submittedAt: 'desc' },
        });
        return recordList.map(mapOnboardingFeedbackRecordToDomain);
    }
}
