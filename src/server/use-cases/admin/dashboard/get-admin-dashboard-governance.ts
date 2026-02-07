import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import {
    CACHE_SCOPE_ORG_INVITATIONS,
    CACHE_SCOPE_SECURITY_EVENTS,
    CACHE_SCOPE_SECURITY_METRICS,
} from '@/server/repositories/cache-scopes';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { GovernanceAlert } from '@/server/types/admin-dashboard';
import { listInvitations } from '@/server/services/org/invitations/invitation-service';
import { listPendingReviewComplianceItemsForUi } from '@/server/use-cases/hr/compliance/list-pending-review-items.cached';
import { resolveDateRange, resolveSecurityEventRepository, resolveSecurityMetricsService } from './admin-dashboard-helpers';

async function buildGovernanceAlerts(
    authorization: RepositoryAuthorizationContext,
): Promise<GovernanceAlert[]> {
    const securityEventRepository = resolveSecurityEventRepository();
    const securityMetricsService = resolveSecurityMetricsService();
    const { start, end } = resolveDateRange(1);

    const [metrics, securityEventsCount, pendingCompliance, pendingInvites] = await Promise.all([
        securityMetricsService.getLatestMetrics(authorization).catch(() => null),
        securityEventRepository.countEventsByOrg(authorization, { startDate: start, endDate: end }).catch(() => 0),
        listPendingReviewComplianceItemsForUi({ authorization, take: 5 }).catch(() => ({ items: [] })),
        listInvitations(authorization, 'pending', 50).catch(() => ({ invitations: [] })),
    ]);

    const alerts: GovernanceAlert[] = [];

    if (metrics?.complianceScore !== undefined && metrics.complianceScore < 80) {
        alerts.push({
            id: 'compliance-score-low',
            title: 'Compliance score needs attention',
            description: `Current compliance score is ${String(metrics.complianceScore)}%. Review remediation plans.`,
            severity: metrics.complianceScore < 65 ? 'high' : 'medium',
            actionLabel: 'Review compliance',
            actionHref: '/hr/compliance',
        });
    }

    if (securityEventsCount > 0) {
        alerts.push({
            id: 'security-events-recent',
            title: 'Recent security activity',
            description: `${String(securityEventsCount)} security events detected in the last 24 hours.`,
            severity: securityEventsCount > 5 ? 'high' : 'medium',
            actionLabel: 'View security events',
            actionHref: '/dev/dashboard',
        });
    }

    if (pendingCompliance.items.length > 0) {
        alerts.push({
            id: 'compliance-approvals',
            title: 'Compliance approvals pending',
            description: `${String(pendingCompliance.items.length)} compliance items awaiting review.`,
            severity: 'medium',
            actionLabel: 'Review queue',
            actionHref: '/hr/compliance',
        });
    }

    if (pendingInvites.invitations.length > 0) {
        alerts.push({
            id: 'pending-invites',
            title: 'Invitations awaiting action',
            description: `${String(pendingInvites.invitations.length)} pending member invites ready to follow up.`,
            severity: 'low',
            actionLabel: 'Manage members',
            actionHref: '/org/members',
        });
    }

    return alerts;
}

export async function getAdminDashboardGovernanceAlerts(
    authorization: RepositoryAuthorizationContext,
): Promise<GovernanceAlert[]> {
    async function getCached(input: RepositoryAuthorizationContext): Promise<GovernanceAlert[]> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);

        registerOrgCacheTag(input.orgId, CACHE_SCOPE_SECURITY_EVENTS, input.dataClassification, input.dataResidency);
        registerOrgCacheTag(input.orgId, CACHE_SCOPE_SECURITY_METRICS, input.dataClassification, input.dataResidency);
        registerOrgCacheTag(input.orgId, CACHE_SCOPE_ORG_INVITATIONS, input.dataClassification, input.dataResidency);

        return buildGovernanceAlerts(input);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return buildGovernanceAlerts(authorization);
    }

    return getCached(toCacheSafeAuthorizationContext(authorization));
}
