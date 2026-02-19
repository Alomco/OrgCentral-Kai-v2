import { faker } from '@faker-js/faker';
import {
    MembershipStatus,
    NotificationChannel,
    type PrismaClient,
} from '@prisma/client';
import { seedFakeEmployeesInternal } from '@/server/services/seeder/seed-employees';
import { seedFakeAbsencesInternal } from '@/server/services/seeder/seed-absences';
import { seedFakeTimeEntriesInternal } from '@/server/services/seeder/seed-time-entries';
import { seedFakeTrainingInternal } from '@/server/services/seeder/seed-training';
import { seedFakePerformanceInternal } from '@/server/services/seeder/seed-performance';
import { seedSecurityEventsInternal } from '@/server/services/seeder/seed-security';
import { seedBillingDataInternal } from '@/server/services/seeder/seed-billing';
import { seedOrgAssetsInternal } from '@/server/services/seeder/seed-org-assets';
import { seedComplianceDataInternal } from '@/server/services/seeder/seed-compliance';
import { seedIntegrationsInternal } from '@/server/services/seeder/seed-integrations';
import { seedStarterDataInternal, seedCommonLeavePoliciesInternal } from '@/server/services/seeder/seed-starter-data';
import { resolveSeedRuntimeConfig, resolvePersonaEmail } from './config';
import { ensureOrganizations, seedRbacAbacFoundations, applyOrgSecurityAndAbsenceDefaults } from './rbac-abac';
import { seedPersonas } from './persona-seeding';
import type { OrganizationActorMap } from './types';

interface OrgScenario {
    key: keyof OrganizationActorMap;
    employees: number;
    absences: number;
    timeEntries: number;
    training: number;
    performance: number;
    notifications: number;
    securityEvents: number;
}

const SEED_SOURCE = 'seed-test-accounts-realistic';
const COMPLIANCE_TITLES = [
    'Data retention review',
    'Mandatory policy acknowledgment follow-up',
    'Training compliance verification',
    'Quarterly compliance evidence refresh',
] as const;

const ORG_SCENARIOS: readonly OrgScenario[] = [
    { key: 'platform', employees: 6, absences: 8, timeEntries: 12, training: 6, performance: 4, notifications: 10, securityEvents: 12 },
    { key: 'alpha', employees: 10, absences: 16, timeEntries: 28, training: 12, performance: 6, notifications: 14, securityEvents: 14 },
    { key: 'beta', employees: 8, absences: 10, timeEntries: 18, training: 9, performance: 5, notifications: 12, securityEvents: 12 },
];

export async function runRealisticTestAccountSeed(prisma: PrismaClient): Promise<void> {
    const config = resolveSeedRuntimeConfig({ requireDatabaseUrl: true });
    const organizations = await ensureOrganizations(prisma);
    await seedRbacAbacFoundations(organizations);
    const { actors } = await seedPersonas(prisma, organizations, config);
    await applyOrgSecurityAndAbsenceDefaults(organizations, actors);

    console.log('Seeding realistic org-linked data for test personas...');
    for (const scenario of ORG_SCENARIOS) {
        const organization = organizations[scenario.key];
        const actor = actors[scenario.key];
        const options = { orgId: organization.id, userId: actor.userId, auditSource: `scripts/${SEED_SOURCE}` };

        await seedStarterDataInternal(options);
        await seedCommonLeavePoliciesInternal(options);
        await seedFakeEmployeesInternal(scenario.employees, options);
        await seedFakeAbsencesInternal(scenario.absences, options);
        await seedFakeTimeEntriesInternal(scenario.timeEntries, options);
        await seedFakeTrainingInternal(scenario.training, options);
        await seedFakePerformanceInternal(scenario.performance, options);
        await seedRealisticNotifications(prisma, organization.id, actor.userId, scenario.notifications);
        await seedSecurityEventsInternal(scenario.securityEvents, options);
        await seedComplianceDataInternal(options);
        await seedComplianceRecordsFallback(prisma, organization.id, actor.userId, 8);
        await seedIntegrationsInternal(options);
        await seedBillingDataInternal(options);
        await seedOrgAssetsInternal(options);
        await seedNotificationPreferencesForActiveMembers(prisma, organization.id);

        console.log(`${organization.slug}: ${await summarizeOrg(prisma, organization.id)}`);
    }

    await verifyPersonaProfiles(prisma, config);
    console.log('Realistic test-account data seeding complete.');
}

async function seedNotificationPreferencesForActiveMembers(prisma: PrismaClient, orgId: string): Promise<void> {
    const employeeProfiles = await prisma.employeeProfile.findMany({
        where: { orgId },
        select: { userId: true },
    });
    const userIds = [...new Set(employeeProfiles.map((profile) => profile.userId))];

    for (const userId of userIds) {
        for (const channel of [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.SMS]) {
            const enabled = channel !== NotificationChannel.SMS;
            await prisma.notificationPreference.upsert({
                where: { orgId_userId_channel: { orgId, userId, channel } },
                update: { enabled, metadata: { seededBy: SEED_SOURCE, default: true } },
                create: { orgId, userId, channel, enabled, metadata: { seededBy: SEED_SOURCE, default: true } },
            });
        }
    }
}

async function seedComplianceRecordsFallback(
    prisma: PrismaClient,
    orgId: string,
    actorUserId: string,
    count: number,
): Promise<void> {
    const activeMemberships = await prisma.membership.findMany({ where: { orgId, status: MembershipStatus.ACTIVE }, select: { userId: true }, take: 20 });
    if (activeMemberships.length === 0) {
        return;
    }

    const complianceTypes = ['GDPR', 'SAR', 'DSEAR', 'POLICY_REVIEW'] as const;
    const statuses = ['open', 'in_progress', 'pending_review', 'resolved'] as const;

    for (let index = 0; index < count; index += 1) {
        const assignee = faker.helpers.arrayElement(activeMemberships);
        const referenceNumber = `CMP-${orgId.slice(0, 8).toUpperCase()}-${String(index + 1).padStart(4, '0')}`;
        const title = faker.helpers.arrayElement(COMPLIANCE_TITLES);
        await prisma.complianceRecord.upsert({
            where: { orgId_referenceNumber: { orgId, referenceNumber } },
            update: {
                title,
                description: faker.lorem.sentence({ min: 10, max: 20 }),
                status: faker.helpers.arrayElement(statuses),
                complianceType: faker.helpers.arrayElement(complianceTypes),
                assignedToOrgId: orgId,
                assignedToUserId: assignee.userId,
                submittedByOrgId: orgId,
                submittedByUserId: actorUserId,
                submittedAt: faker.date.recent({ days: 20 }),
                dueDate: faker.date.soon({ days: 45 }),
                priority: faker.number.int({ min: 1, max: 4 }),
                metadata: { seededBy: SEED_SOURCE, realistic: true },
            },
            create: {
                orgId,
                referenceNumber,
                complianceType: faker.helpers.arrayElement(complianceTypes),
                status: faker.helpers.arrayElement(statuses),
                title,
                description: faker.lorem.sentence({ min: 10, max: 20 }),
                assignedToOrgId: orgId,
                assignedToUserId: assignee.userId,
                submittedByOrgId: orgId,
                submittedByUserId: actorUserId,
                submittedAt: faker.date.recent({ days: 20 }),
                dueDate: faker.date.soon({ days: 45 }),
                priority: faker.number.int({ min: 1, max: 4 }),
                metadata: { seededBy: SEED_SOURCE, realistic: true },
            },
        });
    }
}

async function seedRealisticNotifications(
    prisma: PrismaClient,
    orgId: string,
    actorUserId: string,
    count: number,
): Promise<void> {
    const members = await prisma.membership.findMany({ where: { orgId, status: MembershipStatus.ACTIVE }, select: { userId: true }, take: 50 });
    if (members.length === 0) {
        return;
    }

    for (let index = 0; index < count; index += 1) {
        const member = faker.helpers.arrayElement(members);
        await prisma.hRNotification.create({
            data: {
                orgId,
                userId: member.userId,
                title: faker.helpers.arrayElement([
                    'Compliance task due soon',
                    'Policy update requires acknowledgment',
                    'Training assignment ready',
                    'Document review reminder',
                ]),
                message: faker.lorem.sentence({ min: 8, max: 18 }),
                isRead: false,
                createdByUserId: actorUserId,
                metadata: { seededBy: SEED_SOURCE, realistic: true },
            },
        });
    }
}

async function summarizeOrg(prisma: PrismaClient, orgId: string): Promise<string> {
    const [profiles, absences, leaveRequests, trainings, notifications, compliance, preferences] = await Promise.all([
        prisma.employeeProfile.count({ where: { orgId } }),
        prisma.unplannedAbsence.count({ where: { orgId } }),
        prisma.leaveRequest.count({ where: { orgId } }),
        prisma.trainingRecord.count({ where: { orgId } }),
        prisma.hRNotification.count({ where: { orgId } }),
        prisma.complianceRecord.count({ where: { orgId } }),
        prisma.notificationPreference.count({ where: { orgId } }),
    ]);

    return [`profiles=${String(profiles)}`, `absences=${String(absences)}`, `leave=${String(leaveRequests)}`, `training=${String(trainings)}`, `notifications=${String(notifications)}`, `compliance=${String(compliance)}`, `preferences=${String(preferences)}`].join(', ');
}

async function verifyPersonaProfiles(prisma: PrismaClient, config: ReturnType<typeof resolveSeedRuntimeConfig>): Promise<void> {
    const checks = [
        { key: 'org_alpha_admin_ready', localPart: 'org.alpha.admin.ready' },
        { key: 'org_alpha_hr_manager_ready', localPart: 'org.alpha.hr.manager.ready' },
        { key: 'org_beta_admin_mfa_required', localPart: 'org.beta.admin.mfa.required' },
    ] as const;

    for (const check of checks) {
        const email = resolvePersonaEmail(check.localPart, config);
        const user = await prisma.authUser.findUnique({ where: { email }, select: { id: true } });
        if (!user) {
            throw new Error(`Expected persona user is missing: ${check.key}`);
        }
        const memberships = await prisma.membership.count({ where: { userId: user.id } });
        const profiles = await prisma.employeeProfile.count({ where: { userId: user.id } });
        console.log(`${check.key}: memberships=${String(memberships)}, profiles=${String(profiles)}`);
    }
}
