// src/server/services/seeder/seed-notifications.ts
import { faker } from '@faker-js/faker';
import { createHrNotificationRepository } from '@/server/services/hr/notifications/hr-notification-repository.factory';
import { HR_NOTIFICATION_PRIORITY_VALUES, HR_NOTIFICATION_TYPE_VALUES } from '@/server/types/hr/notifications';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getActiveMembers,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

export async function seedFakeNotificationsInternal(count = 10, options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const repository = createHrNotificationRepository();
        const members = await getActiveMembers(org.id);
        if (!members.length) { return { success: false, message: 'No members.' }; }

        let created = 0;
        for (let index = 0; index < count; index++) {
            const member = faker.helpers.arrayElement(members);
            await repository.createNotification(authorization, {
                orgId: org.id,
                userId: member.userId,
                title: faker.lorem.sentence({ min: 3, max: 6 }),
                message: faker.lorem.paragraph(),
                type: faker.helpers.arrayElement(HR_NOTIFICATION_TYPE_VALUES),
                priority: faker.helpers.arrayElement(HR_NOTIFICATION_PRIORITY_VALUES),
                metadata: getSeededMetadata(),
                dataClassification: authorization.dataClassification,
                residencyTag: authorization.dataResidency,
                createdByUserId: authorization.userId,
            });
            created++;
        }
        return { success: true, message: `Created ${String(created)} notifications`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
