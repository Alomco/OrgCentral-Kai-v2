import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Activity, Briefcase, Receipt } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    ROLE_DASHBOARD_PATHS,
} from '@/server/ui/auth/role-redirect';

import { DashboardPageHeader } from './_components/dashboard-page-header';
import { DashboardWidgetCard } from './_components/dashboard-widget-card';
import { DashboardWidgetSkeleton } from './_components/dashboard-widget-skeleton';
import { ComplianceWidget } from './_components/widgets/compliance-widget';
import { EmployeesWidget } from './_components/widgets/employees-widget';
import { LeaveWidget } from './_components/widgets/leave-widget';
import { PoliciesWidget } from './_components/widgets/policies-widget';
import { hasPermission } from '@/lib/security/permission-check';

export const metadata: Metadata = {
    title: 'Dashboard - OrgCentral',
    description: 'Organization overview and quick actions.',
};

function resolveUserEmail(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 relative overflow-hidden">
            {/* Ambient glow effects */}
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl" />
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
                <div className="space-y-8">
                    <Suspense fallback={<DashboardPageFallback />}>
                        <DashboardPageContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

async function DashboardPageContent() {
    const headerStore = await nextHeaders();

    const { session, authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:dashboard',
    });

    const membershipSnapshot = await getMembershipRoleSnapshot(authorization.orgId, authorization.userId);
    const dashboardRole = membershipSnapshot ? resolveRoleDashboard(membershipSnapshot) : 'employee';

    if (dashboardRole === 'globalAdmin') {
        redirect(ROLE_DASHBOARD_PATHS.globalAdmin);
    }

    const isAdmin = hasPermission(authorization.permissions, 'organization', 'update');
    const isAuditor = hasPermission(authorization.permissions, 'audit', 'read');
    const userEmail = resolveUserEmail(session.user.email);

    return (
        <>
            <DashboardPageHeader
                organizationId={authorization.orgId}
                roleKey={authorization.roleKey}
                userEmail={userEmail}
            />

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <PoliciesWidget session={session} baseAuthorization={authorization} />
                </Suspense>

                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <ComplianceWidget session={session} baseAuthorization={authorization} />
                </Suspense>

                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <LeaveWidget session={session} baseAuthorization={authorization} />
                </Suspense>

                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <EmployeesWidget session={session} baseAuthorization={authorization} />
                </Suspense>

                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <DashboardWidgetCard
                        title="Onboarding"
                        description="Kick off onboarding for new starters."
                        icon={Briefcase}
                        href="/hr/onboarding"
                        ctaLabel="Start onboarding"
                        state={isAdmin ? 'comingSoon' : 'locked'}
                        statusLabel={isAdmin ? 'Coming soon' : 'Admin only'}
                        footerHint={isAdmin ? 'Migrating onboarding flows next.' : null}
                    />
                </Suspense>

                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <DashboardWidgetCard
                        title="Invoices"
                        description="Finance module (invoicing and billing)."
                        icon={Receipt}
                        href="/finance/invoicing"
                        ctaLabel="View invoices"
                        state="comingSoon"
                    />
                </Suspense>

                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <DashboardWidgetCard
                        title="Activity log"
                        description="Security and operational audit trail."
                        icon={Activity}
                        href="/audit"
                        ctaLabel="View activity"
                        state={isAuditor ? 'comingSoon' : 'locked'}
                        statusLabel={isAuditor ? 'Coming soon' : 'Restricted'}
                        footerHint={isAuditor ? 'Audit log UI will surface soon.' : null}
                    />
                </Suspense>
            </div>
        </>
    );
}

function DashboardPageFallback() {
    return (
        <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                </div>
            </header>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <DashboardWidgetSkeleton />
                <DashboardWidgetSkeleton />
                <DashboardWidgetSkeleton />
                <DashboardWidgetSkeleton />
                <DashboardWidgetSkeleton />
                <DashboardWidgetSkeleton />
                <DashboardWidgetSkeleton />
            </div>
        </>
    );
}
