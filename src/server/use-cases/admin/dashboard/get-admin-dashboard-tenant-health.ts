import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_SECURITY_EVENTS, CACHE_SCOPE_SECURITY_METRICS } from '@/server/repositories/cache-scopes';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { TenantHealthOverview, TenantHealthStatus } from '@/server/types/admin-dashboard';
import { fetchOrganization } from '@/server/services/org/organization/organization-service';
import { resolveDateRange, resolveSecurityEventRepository, resolveSecurityMetricsService } from './admin-dashboard-helpers';

function resolveHealthStatus(
    complianceScore: number | null,
    securityEvents: number,
): TenantHealthStatus {
    if (complianceScore !== null && complianceScore < 60) {
        return 'critical';
    }
    if (securityEvents > 3 || (complianceScore !== null && complianceScore < 80)) {
        return 'attention';
    }
    return 'healthy';
}

async function buildTenantHealth(
    authorization: RepositoryAuthorizationContext,
): Promise<TenantHealthOverview> {
    const securityMetricsService = resolveSecurityMetricsService();
    const securityEventRepository = resolveSecurityEventRepository();
    const { start, end } = resolveDateRange(7);

    const [organizationResult, latestMetrics, securityEvents] = await Promise.all([
        fetchOrganization(authorization, authorization.orgId),
        securityMetricsService.getLatestMetrics(authorization).catch(() => null),
        securityEventRepository.countEventsByOrg(authorization, { startDate: start, endDate: end }).catch(() => 0),
    ]);

    const complianceScore = latestMetrics?.complianceScore ?? null;
    const status = resolveHealthStatus(complianceScore, securityEvents);

    return {
        orgId: organizationResult.organization.id,
        dataResidency: organizationResult.organization.dataResidency,
        dataClassification: organizationResult.organization.dataClassification,
        status,
        indicators: [
            {
                label: 'Data residency',
                value: organizationResult.organization.dataResidency,
                description: 'Tenant residency boundary enforced',
                status: 'healthy',
            },
            {
                label: 'Data classification',
                value: organizationResult.organization.dataClassification,
                description: 'Security tier alignment',
                status: organizationResult.organization.dataClassification === 'OFFICIAL' ? 'healthy' : 'attention',
            },
            {
                label: 'Compliance score',
                value: complianceScore !== null ? `${String(complianceScore)}%` : 'No data',
                description: 'Latest security posture metric',
                status: resolveHealthStatus(complianceScore, 0),
            },
            {
                label: 'Security events (7d)',
                value: String(securityEvents),
                description: 'Events logged in the last week',
                status: securityEvents > 5 ? 'attention' : 'healthy',
            },
        ],
    };
}

export async function getAdminDashboardTenantHealth(
    authorization: RepositoryAuthorizationContext,
): Promise<TenantHealthOverview> {
    async function getCached(input: RepositoryAuthorizationContext): Promise<TenantHealthOverview> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);

        registerOrgCacheTag(input.orgId, CACHE_SCOPE_SECURITY_EVENTS, input.dataClassification, input.dataResidency);
        registerOrgCacheTag(input.orgId, CACHE_SCOPE_SECURITY_METRICS, input.dataClassification, input.dataResidency);

        return buildTenantHealth(input);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return buildTenantHealth(authorization);
    }

    return getCached(toCacheSafeAuthorizationContext(authorization));
}
