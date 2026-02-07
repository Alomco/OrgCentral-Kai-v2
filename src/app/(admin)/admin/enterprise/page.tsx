import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoButton, type InfoSection } from '@/components/ui/info-button';
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
                <MetricCard
                    title="Total tenants"
                    value={summary.tenantMetrics.total}
                    info={[
                        { label: 'What', text: 'All tenants provisioned on the platform.' },
                        { label: 'Prereqs', text: 'Tenant records created and scoped.' },
                        { label: 'Next', text: 'Review inactive tenants for cleanup or outreach.' },
                        { label: 'Compliance', text: 'Counts are audited and residency scoped.' },
                    ]}
                />
                <MetricCard
                    title="Active tenants"
                    value={summary.tenantMetrics.active}
                    info={[
                        { label: 'What', text: 'Tenants marked ACTIVE.' },
                        { label: 'Prereqs', text: 'Status set to ACTIVE.' },
                        { label: 'Next', text: 'Investigate suspensions if count drops.' },
                        { label: 'Compliance', text: 'Status changes require approved workflows.' },
                    ]}
                />
                <MetricCard
                    title="Open tickets"
                    value={summary.supportMetrics.openTickets}
                    info={[
                        { label: 'What', text: 'Tickets not yet resolved.' },
                        { label: 'Prereqs', text: 'Tickets logged in the support console.' },
                        { label: 'Next', text: 'Assign owners and confirm severity/SLA.' },
                        { label: 'Compliance', text: 'SLA tracking is audited.' },
                    ]}
                />
                <MetricCard
                    title="Billing plans"
                    value={summary.billingPlans}
                    info={[
                        { label: 'What', text: 'Active plans in the billing catalog.' },
                        { label: 'Prereqs', text: 'Billing catalog configured.' },
                        { label: 'Next', text: 'Review coverage against tenant needs.' },
                        { label: 'Compliance', text: 'Plan changes are logged and permissioned.' },
                    ]}
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2">
                                Governance focus
                                <InfoButton
                                    label="Governance focus"
                                    sections={[
                                        { label: 'What', text: 'Governance signals needing admin attention.' },
                                        { label: 'Prereqs', text: 'Tenant and support metrics enabled.' },
                                        { label: 'Next', text: 'Open relevant workflows and act.' },
                                        { label: 'Compliance', text: 'Signals align to audit and risk controls.' },
                                    ]}
                                />
                            </span>
                            <Badge variant="secondary">Live</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                            <span>Suspended tenants: {summary.tenantMetrics.suspended}</span>
                            <InfoButton
                                label="Suspended tenants"
                                sections={[
                                    { label: 'What', text: 'Tenants temporarily blocked from access.' },
                                    { label: 'Prereqs', text: 'Suspension approved.' },
                                    { label: 'Next', text: 'Review risk notes; restore or archive.' },
                                    { label: 'Compliance', text: 'Suspensions require break-glass approval.' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span>Decommissioned tenants: {summary.tenantMetrics.decommissioned}</span>
                            <InfoButton
                                label="Decommissioned tenants"
                                sections={[
                                    { label: 'What', text: 'Tenants deprovisioned and archived.' },
                                    { label: 'Prereqs', text: 'Decommission workflow completed.' },
                                    { label: 'Next', text: 'Validate retention policy and export.' },
                                    { label: 'Compliance', text: 'Archival actions are audited.' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span>SLA breaches: {summary.supportMetrics.slaBreached}</span>
                            <InfoButton
                                label="SLA breaches"
                                sections={[
                                    { label: 'What', text: 'Tickets past SLA response or resolution.' },
                                    { label: 'Prereqs', text: 'SLA policies configured.' },
                                    { label: 'Next', text: 'Escalate and document remediation.' },
                                    { label: 'Compliance', text: 'Breaches appear in audit reports.' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span>Pending impersonations: {summary.pendingImpersonations}</span>
                            <InfoButton
                                label="Pending impersonations"
                                sections={[
                                    { label: 'What', text: 'Impersonation requests awaiting approval.' },
                                    { label: 'Prereqs', text: 'Break-glass request submitted.' },
                                    { label: 'Next', text: 'Review scope and approve if justified.' },
                                    { label: 'Compliance', text: 'Approvals are time-boxed and audited.' },
                                ]}
                            />
                        </div>
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

function MetricCard({ title, value, info }: { title: string; value: number; info: InfoSection[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{title}</span>
                    <InfoButton label={title} sections={info} />
                </CardTitle>
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
