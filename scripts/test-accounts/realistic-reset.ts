import type { PrismaClient } from '../../src/generated/client';
import { buildSeederServiceDependencies } from '@/server/repositories/providers/seeder/seeder-service-dependencies';
import { SEEDED_METADATA_KEY } from '@/server/services/seeder/utils';

const REALISTIC_SEED_SOURCE = 'seed-test-accounts-realistic';
const TARGET_ORG_SLUGS = ['orgcentral-platform', 'orgcentral-alpha', 'orgcentral-beta'] as const;

export async function resetRealisticTestAccountSeed(prisma: PrismaClient): Promise<void> {
    const organizations = await prisma.organization.findMany({
        where: { slug: { in: [...TARGET_ORG_SLUGS] } },
        select: { id: true, slug: true },
    });

    const { seederCleanupRepository } = buildSeederServiceDependencies();

    for (const organization of organizations) {
        await seederCleanupRepository.clearSeededData(organization.id, SEEDED_METADATA_KEY);

        await prisma.notificationPreference.deleteMany({
            where: {
                orgId: organization.id,
                metadata: { path: ['seededBy'], equals: REALISTIC_SEED_SOURCE },
            },
        });

        await prisma.hRNotification.deleteMany({
            where: {
                orgId: organization.id,
                metadata: { path: ['seededBy'], equals: REALISTIC_SEED_SOURCE },
            },
        });

        await prisma.complianceRecord.deleteMany({
            where: {
                orgId: organization.id,
                metadata: { path: ['seededBy'], equals: REALISTIC_SEED_SOURCE },
            },
        });

        console.log(`Reset seeded data for ${organization.slug}.`);
    }
}
