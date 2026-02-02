import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { listPlatformTenantsService } from '@/server/services/platform/admin/tenant-management-service';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { BreakGlassRequestForm } from './_components/break-glass-request-form';
import { TenantTable } from './_components/tenant-table';

export const metadata: Metadata = {
    title: 'Global Tenant Management - OrgCentral',
    description: 'Review and manage tenant lifecycle status.',
};

interface TenantManagementPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
}

export default async function TenantManagementPage({ searchParams }: TenantManagementPageProps) {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformTenants: ['read'] },
            auditSource: 'ui:admin:tenants',
        },
    );

    const tenants = await loadTenants(authorization, searchParams ?? {});

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Global tenant management</h1>
                <p className="text-sm text-muted-foreground">
                    Approve, suspend, and archive tenant access with audited guardrails.
                </p>
            </header>

            <form className="flex flex-wrap items-end gap-3" method="get">
                <div className="space-y-1">
                    <label htmlFor="q" className="text-xs font-semibold text-muted-foreground">Search tenants</label>
                    <Input id="q" name="q" placeholder="Name, slug, or owner email" />
                </div>
                <Button type="submit" size="sm">Filter</Button>
            </form>

            <BreakGlassRequestForm />

            <TenantTable tenants={tenants.items} />
        </PageContainer>
    );
}

async function loadTenants(
    authorization: RepositoryAuthorizationContext,
    searchParams: Record<string, string | string[] | undefined>,
) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        return loadTenantsUncached(authorization, searchParams);
    }
    return loadTenantsCached(authorization, searchParams);
}

async function loadTenantsCached(
    authorization: RepositoryAuthorizationContext,
    searchParams: Record<string, string | string[] | undefined>,
) {
    'use cache';
    cacheLife('minutes');
    registerCacheTag({
        orgId: authorization.orgId,
        scope: 'platform:tenants',
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });

    return listPlatformTenantsService(authorization, {
        query: typeof searchParams.q === 'string' ? searchParams.q : undefined,
        page: 1,
        pageSize: 25,
    });
}

async function loadTenantsUncached(
    authorization: RepositoryAuthorizationContext,
    searchParams: Record<string, string | string[] | undefined>,
) {
    noStore();
    return listPlatformTenantsService(authorization, {
        query: typeof searchParams.q === 'string' ? searchParams.q : undefined,
        page: 1,
        pageSize: 25,
    });
}
