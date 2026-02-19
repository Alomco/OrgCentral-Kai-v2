import type { JSX } from 'react';
import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RoleScope } from '../../../generated/client';

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

const DEV_ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL?.toLowerCase() ?? null;
const GLOBAL_ADMIN_EMAIL = process.env.GLOBAL_ADMIN_EMAIL?.toLowerCase() ?? null;
const DEV_ADMIN_BYPASS_ENABLED =
    process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_ADMIN_BYPASS === 'true';

function resolveUserEmail(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function isDevelopmentAdminEmail(value: string | null): boolean {
    if (!DEV_ADMIN_BYPASS_ENABLED || !value) {
        return false;
    }

    const normalized = value.trim().toLowerCase();
    return (
        (DEV_ADMIN_EMAIL !== null && normalized === DEV_ADMIN_EMAIL) ||
        (GLOBAL_ADMIN_EMAIL !== null && normalized === GLOBAL_ADMIN_EMAIL)
    );
}

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

    if (authorization.roleScope === RoleScope.GLOBAL && !isDevelopmentAdminEmail(session.user.email)) {
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
            <h1 className="sr-only">Dashboard</h1>
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
