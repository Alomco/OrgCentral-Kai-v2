import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getPlatformTenantDetailService } from '@/server/services/platform/admin/tenant-management-service';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { getAuditLogService } from '@/server/services/org/audit/audit-log-service.provider';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { TenantStatusAction } from '../_components/tenant-status-action';

export const metadata: Metadata = {
    title: 'Tenant Detail - OrgCentral',
    description: 'Review tenant status, billing, and platform actions.',
};

interface TenantDetailPageProps {
    params: Promise<{ tenantId: string }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformTenants: ['read'] },
            auditSource: 'ui:admin:tenant-detail',
        },
    );

    const { tenantId } = await params;
    const tenant = await loadTenantDetail(authorization, tenantId);
    const auditEvents = await loadTenantAudit(authorization, tenantId);

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold text-foreground">{tenant.name}</h1>
                    <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>{tenant.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Tenant ID: {tenant.id}</p>
            </header>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>Slug: {tenant.slug}</p>
                        <p>Region: {tenant.regionCode}</p>
                        <p>Residency: {tenant.dataResidency}</p>
                        <p>Classification: {tenant.dataClassification}</p>
                        <p>Owner: {tenant.ownerEmail ?? 'Not available'}</p>
                        <p>Website: {tenant.website ?? 'Not available'}</p>
                        <div className="pt-2">
                            <Link href="/admin/global/tenant-management" className="text-xs text-primary">
                                ← Back to tenant list
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Billing snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>Subscription status: {tenant.subscription?.status ?? 'Not provisioned'}</p>
                        <p>Stripe price: {tenant.subscription?.stripePriceId ?? 'Not assigned'}</p>
                        <p>Seats: {tenant.subscription?.seatCount ?? 0}</p>
                        <p>Renewal: {tenant.subscription?.currentPeriodEnd ?? 'N/A'}</p>
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle>Guarded actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TenantStatusAction tenantId={tenant.id} action="SUSPEND" breakGlassRequired />
                    <TenantStatusAction tenantId={tenant.id} action="RESTORE" />
                    <TenantStatusAction tenantId={tenant.id} action="ARCHIVE" breakGlassRequired />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Audit history (platform actions)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {auditEvents.length === 0 ? (
                        <p>No platform audit events logged yet.</p>
                    ) : (
                        auditEvents.map((event) => (
                            <div key={event.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                                <span>{event.action}</span>
                                <span className="text-xs">{event.createdAt.toISOString()}</span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

async function loadTenantDetail(
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadTenantDetailUncached(authorization, tenantId);
    }

    return loadTenantDetailCached(authorization, tenantId);
}

async function loadTenantDetailCached(
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
) {
    'use cache';
    cacheLife('minutes');
    registerCacheTag({
        orgId: authorization.orgId,
        scope: `platform:tenant:${tenantId}`,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });

    return loadTenantDetailUncached(authorization, tenantId);
}

async function loadTenantDetailUncached(
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
) {
    return getPlatformTenantDetailService(authorization, tenantId);
}

async function loadTenantAudit(
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
    }

    const service = getAuditLogService();
    const events = await service.listLogs({
        authorization,
        filters: { resource: 'platformTenant' },
        limit: 20,
    });

    return events.filter((event) => event.resourceId === tenantId).slice(0, 6);
}
