import type { OrgRoleKey } from '@/server/security/access-control';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { appLogger } from '@/server/logging/structured-logger';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import type { ICronTenantRepository } from '@/server/repositories/contracts/platform/cron/cron-tenant-repository-contract';
import { AbstractBaseService } from '@/server/services/abstract-base-service';

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

export interface CronServiceDependencies {
    tenantRepository: ICronTenantRepository;
}

export interface CronAuditContext {
    auditSource?: string;
    correlationId?: string;
    triggeredByUserId?: string;
}

export class CronService extends AbstractBaseService {
    private readonly tenantRepository: ICronTenantRepository;

    constructor(dependencies: CronServiceDependencies) {
        super();
        this.tenantRepository = dependencies.tenantRepository;
    }

    async resolveOrgActors(
        orgIds: string[] | undefined,
        rolePriority: OrgRoleKey[],
        auditContext?: CronAuditContext,
    ): Promise<OrgActorResolution> {
        const uniqueOrgIds = orgIds?.length ? Array.from(new Set(orgIds)) : undefined;

        const organizations = await this.tenantRepository.listActiveOrganizations(uniqueOrgIds);

        const orgMap = new Map(
            organizations.map((org) => [org.id, { dataResidency: org.dataResidency, dataClassification: org.dataClassification }]),
        );

        const skipped: OrgActorSkip[] = [];

        if (uniqueOrgIds?.length) {
            for (const requestedOrgId of uniqueOrgIds) {
                if (!orgMap.has(requestedOrgId)) {
                    skipped.push({ orgId: requestedOrgId, reason: 'org-not-found' });
                    appLogger.warn('cron.org.actor.unavailable', {
                        orgId: requestedOrgId,
                        reason: 'org-not-found',
                    });
                }
            }
        }

        if (orgMap.size === 0) {
            return { actors: [], skipped };
        }

        const membershipOrgIds = Array.from(orgMap.keys());

        const memberships = await this.tenantRepository.listActiveMembersByOrgAndRoles(
            membershipOrgIds,
            rolePriority,
        );

        const rolePriorityMap = new Map(rolePriority.map((role, index) => [role, index]));
        const grouped = new Map<string, { userId: string; role: OrgRoleKey }[]>();

        for (const membership of memberships) {
            const roleName = membership.role;
            if (!this.isOrgRoleKey(roleName) || !rolePriorityMap.has(roleName)) {
                continue;
            }
            const candidates = grouped.get(membership.orgId) ?? [];
            candidates.push({ userId: membership.userId, role: roleName });
            grouped.set(membership.orgId, candidates);
        }

        const actors: OrgActor[] = [];

        for (const [orgId, orgMetadata] of orgMap.entries()) {
            const candidates = grouped.get(orgId);
            if (!candidates || candidates.length === 0) {
                skipped.push({ orgId, reason: 'no-actor' });
                appLogger.warn('cron.org.actor.unavailable', {
                    orgId,
                    reason: 'no-actor',
                });
                continue;
            }

            const preferred = [...candidates].sort((a, b) => {
                const aRank = rolePriorityMap.get(a.role) ?? Number.POSITIVE_INFINITY;
                const bRank = rolePriorityMap.get(b.role) ?? Number.POSITIVE_INFINITY;
                return aRank - bRank;
            })[0];

            actors.push({
                orgId,
                userId: preferred.userId,
                role: preferred.role,
                dataResidency: orgMetadata.dataResidency,
                dataClassification: orgMetadata.dataClassification,
            });
        }

        await this.recordActorResolutionAudit(actors, skipped, auditContext);

        return { actors, skipped };
    }

    private isOrgRoleKey(value: string | null | undefined): value is OrgRoleKey {
        return value === 'owner' || value === 'orgAdmin' || value === 'compliance' || value === 'member';
    }

    private async recordActorResolutionAudit(
        actors: OrgActor[],
        skipped: OrgActorSkip[],
        auditContext?: CronAuditContext,
    ): Promise<void> {
        const orgIds = new Set<string>([
            ...actors.map((actor) => actor.orgId),
            ...skipped.map((entry) => entry.orgId),
        ]);

        if (orgIds.size === 0) {
            return;
        }

        const auditSource = auditContext?.auditSource ?? 'cron.resolve-org-actors';
        const userId = auditContext?.triggeredByUserId ?? 'system:cron';

        await Promise.all(Array.from(orgIds).map(async (orgId) => {
            const skippedReasons = skipped
                .filter((entry) => entry.orgId === orgId)
                .map((entry) => entry.reason);
            const selectedActor = actors.find((actor) => actor.orgId === orgId) ?? null;

            await recordAuditEvent({
                orgId,
                userId,
                eventType: 'SYSTEM',
                action: 'cron.resolve-org-actors',
                resource: 'cron.org.actor',
                resourceId: orgId,
                correlationId: auditContext?.correlationId,
                auditSource,
                payload: {
                    selectedActorUserId: selectedActor?.userId ?? null,
                    selectedRole: selectedActor?.role ?? null,
                    skippedReasons,
                },
            });
        }));
    }
}