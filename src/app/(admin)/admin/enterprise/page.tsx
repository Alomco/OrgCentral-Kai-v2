import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getEnterpriseDashboardService } from '@/server/services/platform/admin/enterprise-dashboard-service';

export const metadata: Metadata = {
    title: 'Enterprise Dashboard - OrgCentral',
    description: 'Multi-tenant onboarding and health metrics.',
};

export default async function EnterpriseDashboardPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformTenants: ['read'] },
            auditSource: 'ui:admin:enterprise',
        },
    );

    const summary = await getEnterpriseDashboardService(authorization);

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Enterprise dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Monitor tenant health, support load, and platform readiness.
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Total tenants" value={summary.tenantMetrics.total} />
                <MetricCard title="Active tenants" value={summary.tenantMetrics.active} />
                <MetricCard title="Open tickets" value={summary.supportMetrics.openTickets} />
                <MetricCard title="Billing plans" value={summary.billingPlans} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Governance focus
                            <Badge variant="secondary">Live</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Suspended tenants: {summary.tenantMetrics.suspended}</p>
                        <p>Decommissioned tenants: {summary.tenantMetrics.decommissioned}</p>
                        <p>SLA breaches: {summary.supportMetrics.slaBreached}</p>
                        <p>Pending impersonations: {summary.pendingImpersonations}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <ActionLink href="/admin/global/tenant-management" label="Review tenants" />
                        <ActionLink href="/admin/global/support-tickets" label="Support tickets" />
                        <ActionLink href="/admin/global/billing/plans" label="Billing plans" />
                        <ActionLink href="/admin/global/platform-tools" label="Platform tools" />
                    </CardContent>
                </Card>
            </section>
        </PageContainer>
    );
}

function MetricCard({ title, value }: { title: string; value: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold text-foreground">{value}</div>
            </CardContent>
        </Card>
    );
}

function ActionLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:text-primary"
        >
            {label}
            <span aria-hidden="true">→</span>
        </Link>
    );
}
