import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Clock } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HrPageHeader } from '../_components/hr-page-header';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';
import { TimeEntriesPanel } from './_components/time-entries-panel';
import { CreateTimeEntryForm } from './_components/create-time-entry-form';
import { buildInitialTimeEntryFormState } from './form-state';
import { TimeEntryApprovalPanel } from './_components/time-entry-approval-panel';
import { buildPendingTimeEntries } from './pending-entries';

export default async function HrTimeTrackingPage() {
    const headerStore = await nextHeaders();
    const managerAuthorizationPromise = getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:hr:time-tracking:manager',
            action: 'list',
            resourceType: 'hr.time-entry',
            resourceAttributes: { view: 'team' },
        },
    )
        .then((result) => result.authorization)
        .catch(() => null);
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:time-tracking',
        },
    );
    const managerAuthorization = await managerAuthorizationPromise;

    const initialFormState = buildInitialTimeEntryFormState();
    const pendingEntries = managerAuthorization
        ? await buildPendingTimeEntries(managerAuthorization)
        : [];

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
                        <BreadcrumbPage>Time Tracking</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Time Tracking"
                description="Log your working hours and track time across projects."
                icon={<Clock className="h-5 w-5" />}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <CreateTimeEntryForm
                    initialState={initialFormState}
                />

                <Suspense fallback={<HrCardSkeleton variant="table" />}>
                    <TimeEntriesPanel
                        authorization={authorization}
                        userId={authorization.userId}
                    />
                </Suspense>
            </div>

            {managerAuthorization ? (
                <TimeEntryApprovalPanel entries={pendingEntries} />
            ) : null}
        </div>
    );
}

