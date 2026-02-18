import { z } from 'zod';
import type { OrgRoleKey } from '@/server/security/access-control';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { getCronService } from '@/server/services/platform/cron/cron-service.provider';

const CRON_SECRET = process.env.CRON_SECRET;
const CRON_HEADER = 'x-cron-secret';
const BOOLEAN_TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const UUID_ARRAY_SCHEMA = z.array(z.uuid());

export interface CronRequestOptions {
    orgIds?: string[];
    dryRun: boolean;
}

export type OrgActorSkipReason = 'org-not-found' | 'no-actor';

export interface OrgActor {
    orgId: string;
    userId: string;
    role: OrgRoleKey;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
}

export interface OrgActorSkip {
    orgId: string;
    reason: OrgActorSkipReason;
}

export interface OrgActorResolution {
    actors: OrgActor[];
    skipped: OrgActorSkip[];
}

export interface CronTriggerSummary {
    dryRun: boolean;
    totalOrganizations: number;
    jobsEnqueued: number;
    skipped: OrgActorSkip[];
    metadata?: Record<string, unknown>;
}

export function assertCronSecret(request: Request): void {
    if (!CRON_SECRET) {
        throw new Error('Cron secret is not configured. Set CRON_SECRET in the environment.');
    }

    const provided = request.headers.get(CRON_HEADER);
    if (!provided || provided !== CRON_SECRET) {
        const error = new Error('Unauthorized cron request.');
        error.name = 'CronAuthorizationError';
        throw error;
    }
}

export function parseCronRequestOptions(request: Request): CronRequestOptions {
    const url = new URL(request.url);
    const rawOrgIds = url.searchParams.getAll('orgId').map((value) => value.trim()).filter(Boolean);

    let orgIds: string[] | undefined;
    if (rawOrgIds.length > 0) {
        const parsed = UUID_ARRAY_SCHEMA.safeParse(rawOrgIds);
        if (!parsed.success) {
            throw new Error('Invalid orgId parameter. All orgId values must be valid UUIDs.');
        }
        orgIds = Array.from(new Set(parsed.data));
    }

    const dryRunParameter = url.searchParams.get('dryRun');
    return {
        orgIds,
        dryRun: parseBooleanFlag(dryRunParameter),
    } satisfies CronRequestOptions;
}

export async function resolveOrgActors(
    orgIds: string[] | undefined,
    rolePriority: OrgRoleKey[],
): Promise<OrgActorResolution> {
    const cronService = getCronService();
    return cronService.resolveOrgActors(orgIds, rolePriority, {
        auditSource: 'api:cron:resolve-org-actors',
        triggeredByUserId: 'system:cron',
    });
}

function parseBooleanFlag(value: string | null): boolean {
    if (!value) {
        return false;
    }
    return BOOLEAN_TRUE_VALUES.has(value.trim().toLowerCase());
}
