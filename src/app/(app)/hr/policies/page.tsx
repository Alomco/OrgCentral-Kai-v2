import { Suspense } from 'react';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';
import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PoliciesTableClient } from './_components/policies-table.client';
import { PoliciesHeaderClient } from './_components/policies-header.client';
import { PoliciesFiltersClient } from './_components/policies-filters.client';
import { Skeleton } from '@/components/ui/skeleton';
import { listHrPoliciesForUi } from '@/server/use-cases/hr/policies/list-hr-policies.cached';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import type { HRPolicy } from '@/server/types/hr-ops-types';

import { formatHumanDate } from '../_components/format-date';
import { HrPageHeader } from '../_components/hr-page-header';
import { PolicyAdminPanel } from './_components/policy-admin-panel';

function sortPoliciesByEffectiveDateDescending(policies: HRPolicy[]): HRPolicy[] {
    return policies.toSorted((left, right) => right.effectiveDate.getTime() - left.effectiveDate.getTime());
}

export default function HrPoliciesPage() {
    return (
        <Suspense fallback={<PoliciesPageSkeleton />}>
            <PoliciesPageContent />
        </Suspense>
    );
}

async function PoliciesPageContent({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:policies:list',
    });

    const policiesPromise = listHrPoliciesForUi({ authorization });
    const adminAuthorizationPromise = getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:policies:admin',
            action: 'read',
            resourceType: 'hr.policy',
            resourceAttributes: { view: 'admin' },
        },
    )
        .then((result) => result.authorization)
        .catch(() => null);

    const [{ policies }, adminAuthorization] = await Promise.all([
        policiesPromise,
        adminAuthorizationPromise,
    ]);
    const sortedPolicies = sortPoliciesByEffectiveDateDescending(policies);

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Policies</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between">
                <HrPageHeader
                    title="Policies"
                    description="Review and acknowledge organization policies."
                    icon={<FileText className="h-5 w-5" />}
                />
                <PoliciesHeaderClient />
            </div>

            <div className="flex justify-end">
                <PoliciesFiltersClient />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All policies</CardTitle>
                    <CardDescription>Latest effective policies appear first.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PoliciesTableClient initial={sortedPolicies} />
                </CardContent>
            </Card>

            {adminAuthorization ? (
                <PolicyAdminPanel authorization={adminAuthorization} />
            ) : null}
        </div>
    );
}

function PoliciesPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Policies</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review and acknowledge organization policies.
                    </p>
                </div>
                <Skeleton className="h-6 w-24" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All policies</CardTitle>
                    <CardDescription>Latest effective policies appear first.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

