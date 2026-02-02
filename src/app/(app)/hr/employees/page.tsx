import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Users, Briefcase, Clock, TrendingUp, Download } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { EmployeeDirectoryClient } from './_components/employee-directory-client';

const EmployeeInvitationPanel = dynamic(
    () => import('./_components/employee-invitation-panel').then((module) => module.EmployeeInvitationPanel),
    { loading: () => <Skeleton className="h-40 w-full rounded-2xl" /> },
);
import { getEmployeeList, getEmployeeFilterOptions, getEmployeeStats } from './actions';

export const metadata: Metadata = {
    title: 'Employees',
    description: 'Manage your organization\'s employee records and workforce data.',
};

export default async function HrEmployeesPage() {
    const headerStore = await nextHeaders();
    await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:hr:employees',
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
                        <BreadcrumbPage>Employees</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Employees"
                description="Manage your organization's employee records and workforce data"
                icon={<Users className="h-5 w-5" />}
                actions={(
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <Link href="/hr/employees/export">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Link>
                    </Button>
                )}
            />

            {/* Stats Overview */}
            <Suspense fallback={<StatsRowSkeleton />}>
                <StatsRow />
            </Suspense>

            {/* Employee Directory */}
            <Suspense fallback={<DirectorySkeleton />}>
                <Directory />
            </Suspense>

            {/* Employee Invitations */}
            <EmployeeInvitationPanel />
        </div>
    );
}

async function StatsRow() {
    const stats = await getEmployeeStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">All employees</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.active}</div>
                    <p className="text-xs text-muted-foreground">Currently employed</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.onLeave}</div>
                    <p className="text-xs text-muted-foreground">Currently away</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.newThisMonth}</div>
                    <p className="text-xs text-muted-foreground">Recent hires</p>
                </CardContent>
            </Card>
        </div>
    );
}

async function Directory() {
    const [initialResult, filterOptions] = await Promise.all([
        getEmployeeList({ page: 1, pageSize: 20 }),
        getEmployeeFilterOptions(),
    ]);

    return (
        <EmployeeDirectoryClient
            initialResult={initialResult}
            filterOptions={filterOptions}
        />
    );
}

function StatsRowSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-12" />
                        <Skeleton className="mt-1 h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function DirectorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
    );
}
