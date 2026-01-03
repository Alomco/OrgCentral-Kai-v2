import type { JSX } from 'react';
import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RoleScope } from '@prisma/client';

import { Skeleton } from '@/components/ui/skeleton';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { DashboardPageHeader } from './_components/dashboard-page-header';
import { DashboardWidgetSkeleton } from './_components/dashboard-widget-skeleton';
import { ComplianceWidget } from './_components/widgets/compliance-widget';
import { EmployeesWidget } from './_components/widgets/employees-widget';
import { LeaveWidget } from './_components/widgets/leave-widget';
import { PoliciesWidget } from './_components/widgets/policies-widget';
import { DashboardHero, DashboardHeroSkeleton } from './_components/dashboard-hero';

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

    if (authorization.roleScope === RoleScope.GLOBAL) {
        redirect('/admin/dashboard');
    }

    const userEmail = resolveUserEmail(session.user.email);

    return (
        <>
            <DashboardPageHeader
                organizationId={authorization.orgId}
                roleKey={authorization.roleKey}
                userEmail={userEmail}
            />

            <Suspense fallback={<DashboardHeroSkeleton />}>
                <DashboardHero session={session} baseAuthorization={authorization} />
            </Suspense>

            <DashboardWidgetGrid session={session} authorization={authorization} />
        </>
    );
}

interface DashboardWidgetGridProps {
    session: NonNullable<Awaited<ReturnType<typeof getSessionContextOrRedirect>>['session']>;
    authorization: Awaited<ReturnType<typeof getSessionContextOrRedirect>>['authorization'];
}

function resolveDashboardWidgetFlags() {
    return {
        policies: process.env.NEXT_PUBLIC_FEATURE_POLICIES_WIDGET !== 'false',
        compliance: process.env.NEXT_PUBLIC_FEATURE_COMPLIANCE_WIDGET !== 'false',
        leave: process.env.NEXT_PUBLIC_FEATURE_LEAVE_WIDGET !== 'false',
        employees: process.env.NEXT_PUBLIC_FEATURE_EMPLOYEES_WIDGET !== 'false',
    } as const;
}

function DashboardWidgetGrid({ session, authorization }: DashboardWidgetGridProps) {
    interface DashboardWidgetEntry {
        key: 'policies' | 'compliance' | 'leave' | 'employees';
        element: JSX.Element;
        className?: string;
    }

    const widgetFlags = resolveDashboardWidgetFlags();
    const widgets = ([
        widgetFlags.policies && {
            key: 'policies' as const,
            element: (
                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <PoliciesWidget session={session} baseAuthorization={authorization} />
                </Suspense>
            ),
            className: 'xl:col-span-2 lg:col-span-2',
        },
        widgetFlags.compliance && {
            key: 'compliance' as const,
            element: (
                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <ComplianceWidget session={session} baseAuthorization={authorization} />
                </Suspense>
            ),
        },
        widgetFlags.leave && {
            key: 'leave' as const,
            element: (
                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <LeaveWidget session={session} baseAuthorization={authorization} />
                </Suspense>
            ),
        },
        widgetFlags.employees && {
            key: 'employees' as const,
            element: (
                <Suspense fallback={<DashboardWidgetSkeleton />}>
                    <EmployeesWidget session={session} baseAuthorization={authorization} />
                </Suspense>
            ),
        },
    ].filter(Boolean) as DashboardWidgetEntry[]);

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
            {widgets.map((widget) => (
                <div key={widget.key} className={widget.className}>{widget.element}</div>
            ))}
        </div>
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
