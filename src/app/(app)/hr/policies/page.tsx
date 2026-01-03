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
import { Skeleton } from '@/components/ui/skeleton';
import { listHrPoliciesForUi } from '@/server/use-cases/hr/policies/list-hr-policies.cached';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import type { HRPolicy } from '@/server/types/hr-ops-types';

import { formatHumanDate } from '../_components/format-date';
import { HrPageHeader } from '../_components/hr-page-header';
import { PolicyAdminPanel } from './_components/policy-admin-panel';

function sortPoliciesByEffectiveDateDescending(policies: HRPolicy[]): HRPolicy[] {
    return policies.slice().sort((left, right) => right.effectiveDate.getTime() - left.effectiveDate.getTime());
}

export default function HrPoliciesPage() {
    return (
        <Suspense fallback={<PoliciesPageSkeleton />}>
            <PoliciesPageContent />
        </Suspense>
    );
}

async function PoliciesPageContent() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:policies:list',
    });

    const { policies } = await listHrPoliciesForUi({ authorization });
    const sortedPolicies = sortPoliciesByEffectiveDateDescending(policies);

    const adminAuthorization = await getSessionContext(
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
                <Badge variant="secondary">{sortedPolicies.length} total</Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All policies</CardTitle>
                    <CardDescription>Latest effective policies appear first.</CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedPolicies.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No policies are available yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b text-left">
                                    <tr>
                                        <th className="px-2 py-2 font-medium">Title</th>
                                        <th className="px-2 py-2 font-medium">Category</th>
                                        <th className="px-2 py-2 font-medium">Version</th>
                                        <th className="px-2 py-2 font-medium">Effective</th>
                                        <th className="px-2 py-2 font-medium">Status</th>
                                        <th className="px-2 py-2 font-medium">Ack</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPolicies.map((policy) => (
                                        <tr key={policy.id} className="border-b last:border-b-0 hover:bg-muted/50">
                                            <td className="px-2 py-2">
                                                <Link
                                                    href={`/hr/policies/${policy.id}`}
                                                    className="font-medium underline underline-offset-4"
                                                >
                                                    {policy.title}
                                                </Link>
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">{policy.category}</td>
                                            <td className="px-2 py-2 text-muted-foreground">{policy.version}</td>
                                            <td className="px-2 py-2 text-muted-foreground">
                                                {formatHumanDate(policy.effectiveDate)}
                                            </td>
                                            <td className="px-2 py-2">
                                                <Badge variant="outline">{policy.status}</Badge>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Badge variant={policy.requiresAcknowledgment ? 'secondary' : 'outline'}>
                                                    {policy.requiresAcknowledgment ? 'Required' : 'Optional'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
