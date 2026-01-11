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
import { getLeaveAccrualQueueClient } from '@/server/lib/queues/hr/leave-accrual-queue';
import { leaveAccrualEnvelopeSchema } from '@/server/workers/hr/leave/accrual.types';

const ROLE_PRIORITY: OrgRoleKey[] = ['owner', 'orgAdmin'];
const YEAR_RANGE = { min: 2000, max: 2100 } as const;

const UUID_ARRAY_SCHEMA = z.array(z.uuid());

interface LeaveAccrualCronParams {
    referenceDate?: Date;
    year?: number;
    employeeIds?: string[];
    leaveTypes?: string[];
    jobDryRun: boolean;
}

export async function triggerLeaveAccrualCron(request: Request): Promise<CronTriggerSummary> {
    assertCronSecret(request);
    const { orgIds, dryRun } = parseCronRequestOptions(request);
    const params = parseLeaveAccrualCronParams(request);

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

    const queueClient = getLeaveAccrualQueueClient();
    let jobsEnqueued = 0;

    for (const actor of actors) {
        const correlationId = randomUUID();
        const envelope = leaveAccrualEnvelopeSchema.parse({
            orgId: actor.orgId,
            payload: {
                referenceDate: params.referenceDate,
                year: params.year,
                employeeIds: params.employeeIds,
                leaveTypes: params.leaveTypes,
                dryRun: params.jobDryRun,
            },
            authorization: {
                userId: actor.userId,
                requiredPermissions: { organization: ['update'] },
                expectedClassification: actor.dataClassification,
                expectedResidency: actor.dataResidency,
                auditSource: 'cron:hr:leave:accrual',
                correlationId,
            },
            metadata: {
                correlationId,
                cacheScopes: [WORKER_CACHE_SCOPES.HR_LEAVE],
            },
        });

        if (!dryRun) {
            await queueClient.enqueueAccrualJob(envelope);
            jobsEnqueued += 1;
        }

        appLogger.info('cron.leave.accrual.enqueued', {
            orgId: actor.orgId,
            userId: actor.userId,
            role: actor.role,
            correlationId,
            dryRun,
            jobDryRun: params.jobDryRun,
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

function parseLeaveAccrualCronParams(request: Request): LeaveAccrualCronParams {
    const url = new URL(request.url);
    const referenceParameter = url.searchParams.get('referenceDate');
    let referenceDate: Date | undefined;
    if (referenceParameter) {
        const parsed = new Date(referenceParameter);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error('referenceDate must be a valid ISO-8601 date string.');
        }
        referenceDate = parsed;
    }

    const yearParameter = url.searchParams.get('year');
    let year: number | undefined;
    if (yearParameter !== null) {
        const parsed = Number.parseInt(yearParameter, 10);
        if (Number.isNaN(parsed) || parsed < YEAR_RANGE.min || parsed > YEAR_RANGE.max) {
            throw new Error(
                `year must be an integer between ${String(YEAR_RANGE.min)} and ${String(YEAR_RANGE.max)}.`,
            );
        }
        year = parsed;
    }

    const employeeIds = parseUuidArray(url.searchParams.getAll('employeeId'));
    const leaveTypes = parseStringArray(url.searchParams.getAll('leaveType'));
    const jobDryRun = parseBooleanFlag(url.searchParams.get('jobDryRun'));

    return {
        referenceDate,
        year,
        employeeIds,
        leaveTypes,
        jobDryRun,
    } satisfies LeaveAccrualCronParams;
}

function parseUuidArray(values: string[]): string[] | undefined {
    const sanitized = values.map((value) => value.trim()).filter(Boolean);
    if (!sanitized.length) {
        return undefined;
    }

    const parsed = UUID_ARRAY_SCHEMA.safeParse(sanitized);
    if (!parsed.success) {
        throw new Error('employeeId parameters must all be valid UUIDs.');
    }
    return Array.from(new Set(parsed.data));
}

function parseStringArray(values: string[]): string[] | undefined {
    const sanitized = values.map((value) => value.trim()).filter(Boolean);
    if (!sanitized.length) {
        return undefined;
    }
    return Array.from(new Set(sanitized));
}

function parseBooleanFlag(value: string | null): boolean {
    if (!value) {
        return false;
    }
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function buildMetadata(params: LeaveAccrualCronParams): Record<string, unknown> {
    return {
        referenceDate: params.referenceDate?.toISOString(),
        year: params.year,
        employeeIds: params.employeeIds?.length ?? 0,
        leaveTypes: params.leaveTypes?.length ?? 0,
        jobDryRun: params.jobDryRun,
    } satisfies Record<string, unknown>;
}
