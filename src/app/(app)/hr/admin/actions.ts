'use server';

import { headers as nextHeaders } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import type { AdminDashboardStats, PendingApprovalItem } from './actions.types';

/**
 * Fetch admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'action:hr:admin:stats',
        },
    );

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
            if (!p.startDate) {return false;}
            const startDate = p.startDate instanceof Date ? p.startDate : new Date(p.startDate);
            return startDate >= startOfMonth;
        }).length;
    } catch {
        // Gracefully handle permission errors
    }

    // Note: Compliance and leave stats can be added when proper
    // organization-level summary methods are available

    return stats;
}

/**
 * Fetch pending approval items for HR admin
 */
export async function getPendingApprovals(): Promise<PendingApprovalItem[]> {
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
}
