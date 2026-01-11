import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { OrgRoleKey } from '@/server/security/access-control';
import { appLogger } from '@/server/logging/structured-logger';
import {
    assertCronSecret,
    parseCronRequestOptions,
    resolveOrgActors,
    type CronTriggerSummary,
} from '@/server/api-adapters/cron/cron-shared';
import { WORKER_CACHE_SCOPES } from '@/server/lib/worker-constants';
import { getTrainingReminderQueueClient } from '@/server/lib/queues/hr/training-reminder-queue';
import { trainingReminderEnvelopeSchema } from '@/server/workers/hr/training/reminder.types';

const ROLE_PRIORITY: OrgRoleKey[] = ['orgAdmin', 'compliance', 'owner'];
const DEFAULT_DAYS_UNTIL_EXPIRY = 30;
const MAX_DAYS = 365;
const BOOLEAN_TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

const UUID_ARRAY_SCHEMA = z.array(z.uuid());

interface TrainingCronParams {
    daysUntilExpiry: number;
    referenceDate?: Date;
    includeOverdue: boolean;
    targetUserIds?: string[];
}

export async function triggerTrainingReminderCron(request: Request): Promise<CronTriggerSummary> {
    assertCronSecret(request);
    const { orgIds, dryRun } = parseCronRequestOptions(request);
    const params = parseTrainingCronParams(request);

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

    const queueClient = getTrainingReminderQueueClient();
    let jobsEnqueued = 0;

    for (const actor of actors) {
        const correlationId = randomUUID();
        const envelope = trainingReminderEnvelopeSchema.parse({
            orgId: actor.orgId,
            payload: {
                daysUntilExpiry: params.daysUntilExpiry,
                referenceDate: params.referenceDate,
                includeOverdue: params.includeOverdue,
                targetUserIds: params.targetUserIds,
            },
            authorization: {
                userId: actor.userId,
                requiredAnyPermissions: [
                    { organization: ['update'] },
                    { audit: ['read'] },
                ],
                expectedClassification: actor.dataClassification,
                expectedResidency: actor.dataResidency,
                auditSource: 'cron:hr:training:reminder',
                correlationId,
            },
            metadata: {
                correlationId,
                cacheScopes: [WORKER_CACHE_SCOPES.HR_TRAINING],
            },
        });

        if (!dryRun) {
            await queueClient.enqueueReminderJob(envelope);
            jobsEnqueued += 1;
        }

        appLogger.info('cron.training.reminder.enqueued', {
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

function parseTrainingCronParams(request: Request): TrainingCronParams {
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

    const includeOverdueParameter = url.searchParams.get('includeOverdue');
    const includeOverdue =
        includeOverdueParameter === null || parseBooleanFlag(includeOverdueParameter);

    const referenceParameter = url.searchParams.get('referenceDate');
    let referenceDate: Date | undefined;
    if (referenceParameter) {
        const parsed = new Date(referenceParameter);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error('referenceDate must be a valid ISO-8601 date string.');
        }
        referenceDate = parsed;
    }

    const userIds = parseUserIds(url.searchParams.getAll('userId'));

    return {
        daysUntilExpiry,
        referenceDate,
        includeOverdue,
        targetUserIds: userIds,
    } satisfies TrainingCronParams;
}

function parseUserIds(values: string[]): string[] | undefined {
    if (!values.length) {
        return undefined;
    }
    const trimmed = values.map((value) => value.trim()).filter(Boolean);
    if (!trimmed.length) {
        return undefined;
    }
    const parsed = UUID_ARRAY_SCHEMA.safeParse(trimmed);
    if (!parsed.success) {
        throw new Error('userId parameters must be valid UUIDs when provided.');
    }
    return Array.from(new Set(parsed.data));
}

function parseBooleanFlag(value: string): boolean {
    return BOOLEAN_TRUE_VALUES.has(value.trim().toLowerCase());
}

function buildMetadata(params: TrainingCronParams): Record<string, unknown> {
    return {
        daysUntilExpiry: params.daysUntilExpiry,
        referenceDate: params.referenceDate?.toISOString(),
        includeOverdue: params.includeOverdue,
        targetUserIds: params.targetUserIds,
    } satisfies Record<string, unknown>;
}
