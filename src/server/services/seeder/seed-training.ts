// src/server/services/seeder/seed-training.ts
import { faker } from '@faker-js/faker';
import { buildTrainingServiceDependencies } from '@/server/repositories/providers/hr/training-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getActiveMembers,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

const TRAINING_STATUSES = ['completed', 'in_progress', 'assigned'] as const;

type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export async function seedFakeTrainingInternal(count = 10, options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const { trainingRepository } = buildTrainingServiceDependencies();
        const members = await getActiveMembers(org.id);
        if (!members.length) { return { success: false, message: 'No members.' }; }

        let created = 0;
        for (let index = 0; index < count; index++) {
            const member = faker.helpers.arrayElement(members);
            const startDate = faker.date.past({ years: 1 });
            const status: TrainingStatus = faker.helpers.arrayElement(TRAINING_STATUSES);
            const approved = status === 'completed';
            await trainingRepository.createTrainingRecord(org.id, {
                orgId: org.id,
                userId: member.userId,
                courseName: faker.company.catchPhrase(),
                provider: faker.company.name(),
                startDate,
                endDate: faker.date.future({ years: 1, refDate: startDate }),
                status,
                cost: faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }),
                approved,
                approvedAt: approved ? new Date() : null,
                approvedBy: approved ? authorization.userId : null,
                metadata: getSeededMetadata(),
            });
            created++;
        }
        return { success: true, message: `Created ${String(created)} training records`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
