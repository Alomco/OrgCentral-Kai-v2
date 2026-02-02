import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { ClipboardList, RefreshCw } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HrPageHeader } from '../../_components/hr-page-header';
import { HrCardSkeleton } from '../../_components/hr-card-skeleton';
import { AbsenceListPanel } from '../_components/absences-list-panel';
import { AbsenceApprovalPanel } from '../_components/absence-approval-panel';
import { TeamAbsencePanel } from '../_components/team-absence-panel';
import { buildAbsenceManagerPanels } from '../absence-manager-panels';
import { AbsenceSubnav } from '../_components/absence-subnav';
import { refreshAbsenceRequestsAction } from './actions';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { listAbsenceTypeConfigsForUi } from '@/server/use-cases/hr/absences/list-absence-type-configs.cached';
import { getAbsencesForUi } from '@/server/use-cases/hr/absences/get-absences.cached';
import { buildAbsenceRequestSummary } from './absence-request-utils';

export const metadata: Metadata = {
    title: 'Absence Requests',
    description: 'Review pending absence requests and team availability.',
};

export default async function HrAbsenceRequestsPage() {
    const headerStore = await nextHeaders();
    const correlationId = headerStore.get('x-correlation-id') ?? undefined;

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredAnyPermissions: [
                { [HR_RESOURCE.HR_ABSENCE]: ['read'] },
                { employeeProfile: ['read'] },
            ],
            auditSource: 'ui:hr:absence:requests',
            correlationId,
            action: HR_ACTION.LIST,
            resourceType: HR_RESOURCE.HR_ABSENCE,
            resourceAttributes: {
                scope: 'requests',
                correlationId,
            },
        },
    );

    const managerAuthorization = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:hr:absence:requests:manager',
            correlationId,
            action: HR_ACTION.LIST,
            resourceType: HR_RESOURCE.HR_ABSENCE,
            resourceAttributes: { view: 'team', correlationId },
        },
    )
        .then((result) => result.authorization)
        .catch(() => null);

    const isManager = managerAuthorization !== null;

    const { types: absenceTypes } = await listAbsenceTypeConfigsForUi({ authorization });
    const managerPanels = isManager
        ? await buildAbsenceManagerPanels(managerAuthorization, absenceTypes)
        : null;

    const absencesResult = await getAbsencesForUi({
        authorization,
        userId: authorization.userId,
        includeClosed: true,
    }).catch(() => ({ absences: [] }));

    const summary = buildAbsenceRequestSummary(absencesResult.absences);

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
                            <Link href="/hr/absence">Absence</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Requests</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Absence requests"
                description="Monitor pending reviews and track your submitted absence history."
                icon={<ClipboardList className="h-5 w-5" />}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <AbsenceSubnav />
                <form action={refreshAbsenceRequestsAction}>
                    <Button type="submit" variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </form>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard label="Total" value={summary.total.toString()} />
                <SummaryCard label="Pending" value={summary.pending.toString()} />
                <SummaryCard label="Approved" value={summary.approved.toString()} />
                <SummaryCard label="Rejected" value={summary.rejected.toString()} />
            </div>

            <Suspense fallback={<HrCardSkeleton variant="table" />}>
                <AbsenceListPanel
                    authorization={authorization}
                    userId={authorization.userId}
                    includeClosed
                    title="Absence history"
                    description="Your submitted absence requests and their current status."
                    emptyMessage="No absence requests yet — you’re all set!"
                />
            </Suspense>

            {isManager ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    <AbsenceApprovalPanel
                        authorization={managerAuthorization}
                        pendingRequests={managerPanels?.pendingRequests ?? []}
                    />
                    <TeamAbsencePanel
                        teamAbsences={managerPanels?.teamAbsences ?? []}
                        teamSize={managerPanels?.teamSize ?? 0}
                    />
                </div>
            ) : null}
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
