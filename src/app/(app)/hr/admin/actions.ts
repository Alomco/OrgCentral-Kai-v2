'use server';

import { cache } from 'react';
import { headers as nextHeaders } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { listPendingReviewComplianceItemsForUi } from '@/server/use-cases/hr/compliance/list-pending-review-items.cached';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import { createLruCache } from '@/server/lib/lru-cache';
import type { AdminDashboardStats, PendingApprovalItem } from './actions.types';

const adminStatsCache = createLruCache<string, AdminDashboardStats>({ maxEntries: 50, ttlMs: 30_000 });

function canCacheAdminStats(dataClassification: string): boolean {
    return dataClassification === 'OFFICIAL';
}

/**
 * Fetch admin dashboard statistics
 */
export const getAdminDashboardStats = cache(async (): Promise<AdminDashboardStats> => {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'action:hr:admin:stats',
        },
    );

    const cacheKey = `org:${authorization.tenantScope.orgId}`;
    const shouldCache = canCacheAdminStats(authorization.tenantScope.dataClassification);
    if (shouldCache) {
        const cached = adminStatsCache.get(cacheKey);
        if (cached) {
            return cached;
        }
    }

    const stats: AdminDashboardStats = {
        totalEmployees: 0,
        activeEmployees: 0,
        pendingLeaveRequests: 0,
        complianceAlerts: 0,
        upcomingExpirations: 0,
        newHiresThisMonth: 0,
    };

    try {
        // Get employee counts
        const peopleService = getPeopleService();
        const result = await peopleService.listEmployeeProfiles({
            authorization,
            payload: {},
        });

        stats.totalEmployees = result.profiles.length;
        stats.activeEmployees = result.profiles.filter(
            (p) => p.employmentStatus === 'ACTIVE',
        ).length;

        // Count new hires this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        stats.newHiresThisMonth = result.profiles.filter((p) => {
            if (!p.startDate) { return false; }
            const startDate = p.startDate instanceof Date ? p.startDate : new Date(p.startDate);
            return startDate >= startOfMonth;
        }).length;
    } catch {
        // Gracefully handle permission errors
    }

    const [leaveResult, complianceResult] = await Promise.all([
        getLeaveRequestsForUi({ authorization }).catch(() => ({ requests: [] })),
        listPendingReviewComplianceItemsForUi({ authorization, take: 500 }).catch(() => ({ items: [] })),
    ]);

    stats.pendingLeaveRequests = leaveResult.requests.filter((request) => request.status === 'submitted').length;
    stats.complianceAlerts = complianceResult.items.length;

    // Upcoming expirations can be added once org-level summary is available

    if (shouldCache) {
        adminStatsCache.set(cacheKey, stats);
    }

    return stats;
});

/**
 * Fetch pending approval items for HR admin
 */
export const getPendingApprovals = cache(async (): Promise<PendingApprovalItem[]> => {
    const headerStore = await nextHeaders();
    await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'action:hr:admin:pending-approvals',
        },
    );

    // Placeholder - actual implementation would fetch from multiple services
    const items: PendingApprovalItem[] = [];

    return items;
});
