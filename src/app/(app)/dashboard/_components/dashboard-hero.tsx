import Link from 'next/link';
import { CalendarCheck, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { requireSessionAuthorization } from '@/server/security/authorization';
import { getComplianceStatusService } from '@/server/services/hr/compliance/compliance-status.service.provider';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import type { DashboardViewerContext } from './dashboard-viewer-context';

interface MetricState {
    state: 'ready' | 'locked' | 'error';
    value: number | null;
    hint: string;
}

interface ComplianceMetricState extends MetricState {
    statusLabel: string;
}

function buildLockedMetric(hint: string): MetricState {
    return { state: 'locked', value: null, hint };
}

function buildErrorMetric(hint: string): MetricState {
    return { state: 'error', value: null, hint };
}

async function loadEmployeeMetric(props: DashboardViewerContext): Promise<MetricState> {
    const authorization = await requireSessionAuthorization(props.session, {
        orgId: props.baseAuthorization.orgId,
        requiredPermissions: { employeeProfile: ['list'] },
        auditSource: 'ui:dashboard:hero:employees',
        correlationId: props.baseAuthorization.correlationId,
        action: 'read',
        resourceType: 'employeeProfile',
        resourceAttributes: { view: 'dashboard-hero', metric: 'active-count' },
    }).catch(() => null);

    if (!authorization) {
        return buildLockedMetric('You need employee directory access to view workforce totals.');
    }

    const peopleService = getPeopleService();
    const count = await peopleService
        .countEmployeeProfiles({
            authorization,
            payload: { filters: { employmentStatus: 'ACTIVE' } },
        })
        .then((result) => result.count)
        .catch(() => null);

    if (count === null) {
        return buildErrorMetric('Unable to load workforce totals right now.');
    }

    return { state: 'ready', value: count, hint: 'Active employees' };
}

async function loadComplianceMetric(props: DashboardViewerContext): Promise<ComplianceMetricState> {
    const authorization = await requireSessionAuthorization(props.session, {
        orgId: props.baseAuthorization.orgId,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:dashboard:hero:compliance',
        correlationId: props.baseAuthorization.correlationId,
        action: 'read',
        resourceType: 'hr.compliance',
        resourceAttributes: {
            targetUserId: props.baseAuthorization.userId,
            view: 'dashboard-hero',
        },
    }).catch(() => null);

    if (!authorization) {
        return { ...buildLockedMetric('You need compliance access to view your status.'), statusLabel: 'Restricted' };
    }

    const complianceService = getComplianceStatusService();
    const snapshot = await complianceService
        .getStatusForUser(authorization, props.baseAuthorization.userId)
        .catch(() => null);

    if (!snapshot) {
        return { ...buildErrorMetric('Unable to load compliance snapshot right now.'), statusLabel: 'Unknown' };
    }

    return {
        state: 'ready',
        value: snapshot.itemCount,
        statusLabel: snapshot.status,
        hint: 'Compliance items assigned to you',
    };
}

export async function DashboardHero(props: DashboardViewerContext) {
    const [employees, compliance] = await Promise.all([
        loadEmployeeMetric(props),
        loadComplianceMetric(props),
    ]);

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <Card className="relative overflow-hidden border-none bg-linear-to-br from-blue-600 via-indigo-600 to-sky-600 text-white shadow-xl">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-lg font-semibold">Workforce pulse</CardTitle>
                    <CardDescription className="text-blue-100">
                        Live headcount and quick links for people ops.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold tracking-tight">
                            {employees.value ?? '—'}
                        </span>
                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                            {employees.hint}
                        </Badge>
                    </div>
                    <div className="text-sm text-blue-50">
                        {employees.state === 'locked' && 'Access is restricted for your role.'}
                        {employees.state === 'error' && employees.hint}
                        {employees.state === 'ready' && 'Track active workforce and onboarding progress.'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                            <Link href="/hr/employees">Open directory</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                            <Link href="/hr/onboarding/new">Onboard new hire</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-linear-to-br from-emerald-50 via-white to-slate-50 shadow-lg dark:from-emerald-950/50 dark:via-slate-950/40 dark:to-slate-900/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-emerald-900 dark:text-emerald-100">Compliance health</CardTitle>
                        <CardDescription className="text-sm text-emerald-700 dark:text-emerald-200/80">
                            Your assigned items and status.
                        </CardDescription>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner dark:bg-emerald-900/50 dark:text-emerald-200">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-semibold text-emerald-900 dark:text-white">
                            {compliance.value ?? '—'}
                        </span>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-800 dark:border-emerald-800/80 dark:text-emerald-100">
                            {compliance.statusLabel}
                        </Badge>
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200/80">{compliance.hint}</p>
                    <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800/70 dark:text-emerald-100 dark:hover:bg-emerald-900/50">
                            <Link href="/hr/compliance">Review items</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-linear-to-br from-white via-slate-50 to-indigo-50 shadow-lg dark:from-slate-900/70 dark:via-slate-900 dark:to-indigo-900/40">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">Actions</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Move quickly between HR flows.
                        </CardDescription>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 shadow-inner dark:bg-indigo-900/50 dark:text-indigo-200">
                        <CalendarCheck className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <Button asChild variant="secondary" className="justify-start">
                        <Link href="/hr/leave">Leave requests</Link>
                    </Button>
                    <Button asChild variant="secondary" className="justify-start">
                        <Link href="/org/profile">Org profile</Link>
                    </Button>
                    <Button asChild variant="secondary" className="justify-start">
                        <Link href="/hr/training">Training & policies</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export function DashboardHeroSkeleton() {
    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
                <Card key={key} className="border-none">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-4 w-40" />
                        <div className="grid gap-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
