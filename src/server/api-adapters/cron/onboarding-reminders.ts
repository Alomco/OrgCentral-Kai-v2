import { randomUUID } from 'node:crypto';
import type { OrgRoleKey } from '@/server/security/access-control';
import { appLogger } from '@/server/logging/structured-logger';
import {
    assertCronSecret,
    parseCronRequestOptions,
    resolveOrgActors,
    type CronTriggerSummary,
} from '@/server/api-adapters/cron/cron-shared';
import { WORKER_CACHE_SCOPES } from '@/server/lib/worker-constants';
import { getOnboardingReminderQueueClient } from '@/server/lib/queues/hr/onboarding-reminder-queue';
import { onboardingReminderEnvelopeSchema } from '@/server/workers/hr/onboarding/onboarding-reminder.types';

const ROLE_PRIORITY: OrgRoleKey[] = ['orgAdmin', 'compliance', 'owner'];

export async function triggerOnboardingReminderCron(request: Request): Promise<CronTriggerSummary> {
    assertCronSecret(request);
    const { orgIds, dryRun } = parseCronRequestOptions(request);

    const { actors, skipped } = await resolveOrgActors(orgIds, ROLE_PRIORITY);

    if (actors.length === 0) {
        return {
            dryRun,
            totalOrganizations: 0,
            jobsEnqueued: 0,
            skipped,
        } satisfies CronTriggerSummary;
    }

    const queueClient = getOnboardingReminderQueueClient();
    let jobsEnqueued = 0;

    for (const actor of actors) {
        const correlationId = randomUUID();
        const envelope = onboardingReminderEnvelopeSchema.parse({
            orgId: actor.orgId,
            payload: {
                dryRun,
            },
            authorization: {
                userId: actor.userId,
                requiredAnyPermissions: [
                    { organization: ['update'] },
                    { audit: ['read'] },
                ],
                expectedClassification: actor.dataClassification,
                expectedResidency: actor.dataResidency,
                auditSource: 'cron:hr:onboarding:reminder',
                correlationId,
            },
            metadata: {
                correlationId,
                cacheScopes: [WORKER_CACHE_SCOPES.HR_ONBOARDING],
            },
        });

        if (!dryRun) {
            await queueClient.enqueueReminderJob(envelope);
            jobsEnqueued += 1;
        }

        appLogger.info('cron.onboarding.reminder.enqueued', {
            orgId: actor.orgId,
            userId: actor.userId,
            role: actor.role,
            correlationId,
            dryRun,
        });
    }

    return {
        dryRun,
        totalOrganizations: actors.length,
        jobsEnqueued,
        skipped,
    } satisfies CronTriggerSummary;
}
