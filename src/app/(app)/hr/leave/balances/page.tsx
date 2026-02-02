import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Briefcase, RefreshCw } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HrPageHeader } from '../../_components/hr-page-header';
import { LeaveSubnav } from '../_components/leave-subnav';
import { LeaveBalanceGrid } from '../_components/leave-request-form.sections';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import { getLeaveBalanceForUi } from '@/server/use-cases/hr/leave/get-leave-balance.cached';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { refreshLeaveBalancesAction } from './actions';
import { calculateLeaveBalanceTotals, resolveBalanceYear } from './balance-utils';

export const metadata: Metadata = {
    title: 'Leave Balances',
    description: 'Track your leave entitlements and remaining balance by year.',
};

interface PageProps {
    searchParams?: Promise<{ year?: string | string[] }>;
}

export default async function HrLeaveBalancesPage({ searchParams }: PageProps) {
    const headerStore = await nextHeaders();
    const correlationId = headerStore.get('x-correlation-id') ?? undefined;

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredAnyPermissions: [
                { [HR_RESOURCE.HR_LEAVE_BALANCE]: ['read'] },
                { employeeProfile: ['read'] },
            ],
            auditSource: 'ui:hr:leave:balances',
            correlationId,
            action: HR_ACTION.READ,
            resourceType: HR_RESOURCE.HR_LEAVE_BALANCE,
            resourceAttributes: {
                scope: 'balances',
                correlationId,
            },
        },
    );

    const peopleService = getPeopleService();
    const profileResult = await peopleService.getEmployeeProfileByUser({
        authorization,
        payload: { userId: authorization.userId },
    }).catch(() => null);

    const profile = profileResult?.profile ?? null;
    const employeeId = profile?.id ?? null;

    const resolvedSearchParams = await searchParams;
    const currentYear = new Date().getFullYear();
    const resolvedYear = resolveBalanceYear(resolvedSearchParams?.year, currentYear);

    const balanceResult = employeeId
        ? await getLeaveBalanceForUi({ authorization, employeeId, year: resolvedYear })
            .catch(() => ({ balances: [], employeeId, year: resolvedYear }))
        : { balances: [], employeeId: employeeId ?? '', year: resolvedYear };

    const totals = calculateLeaveBalanceTotals(balanceResult.balances);
    const yearOptions = [currentYear, currentYear - 1];

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
                        <BreadcrumbLink asChild>
                            <Link href="/hr/leave">Leave</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Balances</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Leave balances"
                description="Monitor entitlements, usage, and availability by policy year."
                icon={<Briefcase className="h-5 w-5" />}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <LeaveSubnav />
                <form action={refreshLeaveBalancesAction}>
                    <Button type="submit" variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </form>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Balance snapshot</CardTitle>
                    <CardDescription>Year {resolvedYear} totals for your approved leave policies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {yearOptions.map((year) => (
                            <Button
                                key={year}
                                asChild
                                size="sm"
                                variant={year === resolvedYear ? 'default' : 'outline'}
                            >
                                <Link href={`/hr/leave/balances?year=${String(year)}`}>{year.toString()}</Link>
                            </Button>
                        ))}
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard label="Entitlement" value={formatDays(totals.totalEntitlement)} />
                        <SummaryCard label="Used" value={formatDays(totals.used)} />
                        <SummaryCard label="Pending" value={formatDays(totals.pending)} />
                        <SummaryCard label="Available" value={formatDays(totals.available)} />
                    </div>
                </CardContent>
            </Card>

            {employeeId ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Balances by leave type</CardTitle>
                        <CardDescription>Detailed entitlements for your active leave types.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaveBalanceGrid balances={balanceResult.balances} />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Leave balances</CardTitle>
                        <CardDescription>
                            Your account is missing an employee profile. Ask your administrator to complete it before requesting leave.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/hr/profile">Go to profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <Card className="border-border/60 bg-background/60">
            <CardHeader className="space-y-1">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
            </CardHeader>
        </Card>
    );
}

function formatDays(value: number): string {
    return `${value.toLocaleString()} days`;
}
