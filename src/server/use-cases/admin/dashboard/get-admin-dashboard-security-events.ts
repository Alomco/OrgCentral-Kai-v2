import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_SECURITY_EVENTS } from '@/server/repositories/cache-scopes';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { SecurityEventSeverity, SecurityEventSummary } from '@/server/types/admin-dashboard';
import { resolveDateRange, resolveSecurityEventRepository } from './admin-dashboard-helpers';

async function buildSecurityEvents(
    authorization: RepositoryAuthorizationContext,
): Promise<SecurityEventSummary[]> {
    const repository = resolveSecurityEventRepository();
    const { start, end } = resolveDateRange(7);

    const events = await repository.getEventsByOrg(authorization, {
        startDate: start,
        endDate: end,
        limit: 6,
        offset: 0,
    }).catch(() => []);

    const severityLevels: SecurityEventSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
    const resolveSeverity = (severity: string): SecurityEventSeverity =>
        severityLevels.includes(severity as SecurityEventSeverity)
            ? (severity as SecurityEventSeverity)
            : 'info';

    return events.map((event) => ({
        id: event.id,
        title: event.eventType,
        description: event.description,
        severity: resolveSeverity(event.severity),
        occurredAt: event.createdAt,
    }));
}

export async function getAdminDashboardSecurityEvents(
    authorization: RepositoryAuthorizationContext,
): Promise<SecurityEventSummary[]> {
    async function getCached(input: RepositoryAuthorizationContext): Promise<SecurityEventSummary[]> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);

        registerOrgCacheTag(input.orgId, CACHE_SCOPE_SECURITY_EVENTS, input.dataClassification, input.dataResidency);

        return buildSecurityEvents(input);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return buildSecurityEvents(authorization);
    }

    return getCached(toCacheSafeAuthorizationContext(authorization));
}
