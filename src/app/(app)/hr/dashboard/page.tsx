import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { hasPermission } from '@/lib/security/permission-check';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import {
    DashboardSkeleton,
    PoliciesSummaryCard,
    PoliciesSummarySkeleton,
    WelcomeCard,
    WelcomeSkeleton,
} from './_components/dashboard-cards';
import { KpiGrid, KpiGridSkeleton } from './_components/kpi-grid';
import { PeopleStats, PeopleStatsSkeleton } from './_components/people-stats';
import { QuickActions, QuickActionsSkeleton } from './_components/quick-actions-enhanced';
import { RecentActivityFeed, RecentActivitySkeleton } from './_components/recent-activity-feed';
import { ManagerSnapshot, ManagerSnapshotSkeleton } from './_components/manager-snapshot';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import motionStyles from '@/styles/motion/view-transitions.module.css';

export const metadata: Metadata = {
    title: 'HR Dashboard',
    description: 'Your personal HR dashboard for managing tasks and viewing policies.',
};

export default function HrDashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}

async function DashboardContent() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:dashboard',
    });

    const isAdmin = hasPermission(authorization.permissions, 'organization', 'update');
    const peopleService = getPeopleService();
    const profileResult = await peopleService.getEmployeeProfileByUser({
        authorization,
        payload: { userId: authorization.userId },
    }).catch(() => null);
    const profile = profileResult?.profile ?? null;
    const employeeId = profile?.id ?? null;

    return (
        <div className="space-y-6 hr-dashboard-surface">
            <h1 className="sr-only">HR Dashboard</h1>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <h2 className={"text-2xl font-semibold tracking-tight text-foreground " + motionStyles.sharedTitle}>
                Dashboard
            </h2>

            {/* Welcome Card */}
            <Suspense fallback={<WelcomeSkeleton />}>
                <WelcomeCard authorization={authorization} profile={profile} />
            </Suspense>

            {/* KPI Overview */}
            <Suspense fallback={<KpiGridSkeleton />}>
                <KpiGrid authorization={authorization} employeeId={employeeId} />
            </Suspense>

            {/* Quick Actions */}
            <Suspense fallback={<QuickActionsSkeleton />}>
                <QuickActions authorization={authorization} />
            </Suspense>

            <div className="grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<RecentActivitySkeleton />}>
                    <RecentActivityFeed authorization={authorization} />
                </Suspense>

                <div className="space-y-6">
                    {isAdmin ? (
                        <Suspense fallback={<PeopleStatsSkeleton />}>
                            <PeopleStats authorization={authorization} />
                        </Suspense>
                    ) : null}
                    <Suspense fallback={<ManagerSnapshotSkeleton />} >
                        <ManagerSnapshot authorization={authorization} />
                    </Suspense>
                </div>
            </div>

            {/* Policies Summary */}
            <Suspense fallback={<PoliciesSummarySkeleton />}>
                <PoliciesSummaryCard authorization={authorization} />
            </Suspense>
        </div>
    );
}
