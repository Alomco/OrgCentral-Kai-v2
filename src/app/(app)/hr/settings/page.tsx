import { headers as nextHeaders } from 'next/headers';
import { Suspense } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';

import { HrPageHeader } from '../_components/hr-page-header';
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
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { HrSettingsPanel } from './_components/hr-settings-panel';

function HrSettingsSkeletonCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="h-4 w-40 rounded bg-muted" />
                </CardTitle>
                <CardDescription>
                    <div className="h-3 w-80 rounded bg-muted" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <div className="h-3 w-28 rounded bg-muted" />
                        <div className="h-9 w-full rounded bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-28 rounded bg-muted" />
                        <div className="h-9 w-full rounded bg-muted" />
                    </div>
                </div>
                <div className="mt-6 h-10 w-full rounded bg-muted/60" />
                <div className="mt-6 h-9 w-24 rounded bg-muted" />
            </CardContent>
        </Card>
    );
}

export default async function HrSettingsPage() {
    const headerStore = await nextHeaders();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr-settings:page',
        },
    );

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
                        <BreadcrumbPage>Settings</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="HR Settings"
                description={`Configure HR defaults for org ${authorization.orgId}.`}
                icon={<Settings className="h-5 w-5" />}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Data controls</CardTitle>
                    <CardDescription>
                        Tenant scoping and caching are enforced using this context.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Org {authorization.orgId}</Badge>
                    <Badge variant="outline">Residency {authorization.dataResidency}</Badge>
                    <Badge variant="outline">Classification {authorization.dataClassification}</Badge>
                </CardContent>
            </Card>

            <Suspense fallback={<HrSettingsSkeletonCard />}>
                <HrSettingsPanel authorization={authorization} />
            </Suspense>
        </div>
    );
}
