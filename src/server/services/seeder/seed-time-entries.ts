// src/server/services/seeder/seed-time-entries.ts
import { faker } from '@faker-js/faker';
import { TimeEntryStatus } from '@/server/types/prisma';
import { buildTimeTrackingServiceDependencies } from '@/server/repositories/providers/hr/time-tracking-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getActiveMembers,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

export async function seedFakeTimeEntriesInternal(count = 20, options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const { timeEntryRepository } = buildTimeTrackingServiceDependencies();
        const members = await getActiveMembers(org.id);
        if (!members.length) { return { success: false, message: 'No members.' }; }

        let created = 0;
        for (let index = 0; index < count; index++) {
            const member = faker.helpers.arrayElement(members);
            const date = faker.date.recent({ days: 30 });
            const clockIn = new Date(date);
            clockIn.setHours(9, 0, 0, 0); // 9 AM
            const clockOut = new Date(date);
            clockOut.setHours(17, 0, 0, 0); // 5 PM

            await timeEntryRepository.createTimeEntry(org.id, {
                orgId: org.id,
                userId: member.userId,
                date,
                clockIn,
                clockOut,
                totalHours: 8,
                breakDuration: 1, // 1 hour break
                status: TimeEntryStatus.COMPLETED,
                project: faker.commerce.productName(),
                tasks: { summary: faker.company.buzzPhrase() },
                metadata: getSeededMetadata(),
                dataClassification: authorization.dataClassification,
                residencyTag: authorization.dataResidency,
            });
            created++;
        }
        return { success: true, message: `Created ${String(created)} time entries`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
