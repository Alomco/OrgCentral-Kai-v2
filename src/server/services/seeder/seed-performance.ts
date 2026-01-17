// src/server/services/seeder/seed-performance.ts
import { faker } from '@faker-js/faker';
import { buildPerformanceServiceDependencies } from '@/server/repositories/providers/hr/performance-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getActiveMembers,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

export async function seedFakePerformanceInternal(count = 5, options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const { repositoryFactory } = buildPerformanceServiceDependencies();
        const repository = repositoryFactory(authorization);
        const members = await getActiveMembers(org.id);
        if (members.length < 2) { return { success: false, message: 'Need at least 2 members (reviewer/reviewee).' }; }

        let created = 0;
        for (let index = 0; index < count; index++) {
            const reviewee = faker.helpers.arrayElement(members);
            const reviewer = members.find((member) => member.userId !== reviewee.userId) ?? members[0];

            const review = await repository.createReview({
                employeeId: reviewee.userId,
                reviewerUserId: reviewer.userId,
                periodStartDate: faker.date.past({ years: 1 }),
                periodEndDate: new Date(),
                scheduledDate: faker.date.recent(),
                status: 'completed',
                overallRating: faker.number.int({ min: 1, max: 5 }),
                strengths: faker.lorem.paragraph(),
                areasForImprovement: faker.lorem.paragraph(),
                metadata: getSeededMetadata(),
            });

            await repository.addGoal(review.id, {
                description: faker.lorem.sentence(),
                targetDate: faker.date.future(),
                status: 'IN_PROGRESS',
                rating: faker.number.int({ min: 1, max: 5 }),
                comments: faker.lorem.sentence(),
            });

            created++;
        }
        return { success: true, message: `Created ${String(created)} performance reviews`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
