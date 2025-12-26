import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { UserX } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';
import { AbsenceListPanel } from './_components/absences-list-panel';
import { ReportAbsenceForm } from './_components/report-absence-form';
import { buildInitialReportAbsenceFormState } from './form-state';

export default async function HrAbsencesPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:absences',
        },
    );

    const initialFormState = buildInitialReportAbsenceFormState();

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
                        <BreadcrumbPage>Absences</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Absences"
                description="Report unplanned absences and manage return-to-work flows."
                icon={<UserX className="h-5 w-5" />}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <ReportAbsenceForm
                    authorization={authorization}
                    initialState={initialFormState}
                />

                <Suspense fallback={<HrCardSkeleton variant="table" />}>
                    <AbsenceListPanel
                        authorization={authorization}
                        userId={authorization.userId}
                    />
                </Suspense>
            </div>
        </div>
    );
}
