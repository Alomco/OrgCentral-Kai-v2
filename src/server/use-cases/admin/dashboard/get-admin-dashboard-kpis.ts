import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import {
    CACHE_SCOPE_MEMBERS,
    CACHE_SCOPE_ORG_INVITATIONS,
    CACHE_SCOPE_ROLES,
    CACHE_SCOPE_SECURITY_METRICS,
} from '@/server/repositories/cache-scopes';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { AdminDashboardKpis } from '@/server/types/admin-dashboard';
import { getRoleService, getUserService } from '@/server/services/org';
import { listInvitations } from '@/server/services/org/invitations/invitation-service';
import { resolveSecurityMetricsService } from './admin-dashboard-helpers';

async function buildKpis(authorization: RepositoryAuthorizationContext): Promise<AdminDashboardKpis> {
    const userService = getUserService();
    const roleService = getRoleService();
    const securityMetricsService = resolveSecurityMetricsService();

    const [activeMembers, invitedMembers, roles, pendingInvites, latestMetrics] = await Promise.all([
        userService.countUsersInOrganization({ authorization, filters: { status: 'ACTIVE' } }).catch(() => 0),
        userService.countUsersInOrganization({ authorization, filters: { status: 'INVITED' } }).catch(() => 0),
        roleService.listRoles({ authorization }).catch(() => []),
        listInvitations(authorization, 'pending', 250).catch(() => ({ invitations: [] })),
        securityMetricsService.getLatestMetrics(authorization).catch(() => null),
    ]);

    const pendingInvitesCount = pendingInvites.invitations.length;

    return {
        activeMembers,
        pendingInvites: Math.max(invitedMembers, pendingInvitesCount),
        totalRoles: roles.length,
        complianceScore: latestMetrics?.complianceScore ?? null,
    };
}

export async function getAdminDashboardKpis(
    authorization: RepositoryAuthorizationContext,
): Promise<AdminDashboardKpis> {
    async function getCached(input: RepositoryAuthorizationContext): Promise<AdminDashboardKpis> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);

        registerOrgCacheTag(input.orgId, CACHE_SCOPE_MEMBERS, input.dataClassification, input.dataResidency);
        registerOrgCacheTag(input.orgId, CACHE_SCOPE_ORG_INVITATIONS, input.dataClassification, input.dataResidency);
        registerOrgCacheTag(input.orgId, CACHE_SCOPE_ROLES, input.dataClassification, input.dataResidency);
        registerOrgCacheTag(input.orgId, CACHE_SCOPE_SECURITY_METRICS, input.dataClassification, input.dataResidency);

        return buildKpis(input);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return buildKpis(authorization);
    }

    return getCached(toCacheSafeAuthorizationContext(authorization));
}
