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
import { getComplianceReminderQueueClient } from '@/server/lib/queues/hr/compliance-reminder-queue';
import { complianceReminderEnvelopeSchema } from '@/server/workers/hr/compliance/reminder.types';

const ROLE_PRIORITY: OrgRoleKey[] = ['orgAdmin', 'compliance', 'owner'];
const DEFAULT_DAYS_UNTIL_EXPIRY = 30;
const MAX_DAYS = 365;

interface ComplianceCronParams {
    daysUntilExpiry: number;
    referenceDate?: Date;
}

export async function triggerComplianceReminderCron(request: Request): Promise<CronTriggerSummary> {
    assertCronSecret(request);
    const { orgIds, dryRun } = parseCronRequestOptions(request);
    const params = parseComplianceCronParams(request);

    const { actors, skipped } = await resolveOrgActors(orgIds, ROLE_PRIORITY);

    if (actors.length === 0) {
        return {
            dryRun,
            totalOrganizations: 0,
            jobsEnqueued: 0,
            skipped,
            metadata: buildMetadata(params),
        } satisfies CronTriggerSummary;
    }

    const queueClient = getComplianceReminderQueueClient();
    let jobsEnqueued = 0;

    for (const actor of actors) {
        const correlationId = randomUUID();
        const envelope = complianceReminderEnvelopeSchema.parse({
            orgId: actor.orgId,
            payload: {
                daysUntilExpiry: params.daysUntilExpiry,
                referenceDate: params.referenceDate,
            },
            authorization: {
                userId: actor.userId,
                requiredAnyPermissions: [
                    { organization: ['update'] },
                    { audit: ['read'] },
                ],
                expectedClassification: actor.dataClassification,
                expectedResidency: actor.dataResidency,
                auditSource: 'cron:hr:compliance:reminder',
                correlationId,
            },
            metadata: {
                correlationId,
                cacheScopes: [WORKER_CACHE_SCOPES.HR_COMPLIANCE],
            },
        });

        if (!dryRun) {
            await queueClient.enqueueReminderJob(envelope);
            jobsEnqueued += 1;
        }

        appLogger.info('cron.compliance.reminder.enqueued', {
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
        metadata: buildMetadata(params),
    } satisfies CronTriggerSummary;
}

function parseComplianceCronParams(request: Request): ComplianceCronParams {
    const url = new URL(request.url);
    const daysParameter = url.searchParams.get('daysUntilExpiry') ?? url.searchParams.get('days');
    let daysUntilExpiry = DEFAULT_DAYS_UNTIL_EXPIRY;

    if (daysParameter !== null) {
        const parsed = Number.parseInt(daysParameter, 10);
        if (!Number.isNaN(parsed) && parsed > 0 && parsed <= MAX_DAYS) {
            daysUntilExpiry = parsed;
        } else {
            throw new Error(`daysUntilExpiry must be an integer between 1 and ${String(MAX_DAYS)}.`);
        }
    }

    const referenceParameter = url.searchParams.get('referenceDate');
    let referenceDate: Date | undefined;
    if (referenceParameter) {
        const parsed = new Date(referenceParameter);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error('referenceDate must be a valid ISO-8601 date string.');
        }
        referenceDate = parsed;
    }

    return { daysUntilExpiry, referenceDate } satisfies ComplianceCronParams;
}

function buildMetadata(params: ComplianceCronParams): Record<string, unknown> {
    return {
        daysUntilExpiry: params.daysUntilExpiry,
        referenceDate: params.referenceDate?.toISOString(),
    } satisfies Record<string, unknown>;
}
