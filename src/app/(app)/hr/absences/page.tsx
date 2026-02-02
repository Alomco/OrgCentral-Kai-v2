import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HrPageHeader } from '../_components/hr-page-header';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';
import { AbsenceListPanel } from '../absence/_components/absences-list-panel';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';

export const metadata: Metadata = {
    title: 'Absence History',
    description: 'Review your submitted absence history and status updates.',
};

export default async function HrAbsencesPage() {
    const headerStore = await nextHeaders();
    const correlationId = headerStore.get('x-correlation-id') ?? undefined;

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:absences',
            correlationId,
            action: HR_ACTION.LIST,
            resourceType: HR_RESOURCE.HR_ABSENCE,
            resourceAttributes: { scope: 'history', correlationId },
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
                        <BreadcrumbPage>Absences</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Absence history"
                description="Review your submitted absence history and status updates."
                icon={<ClipboardList className="h-5 w-5" />}
            />

            <Suspense fallback={<HrCardSkeleton variant="table" />}>
                <AbsenceListPanel
                    authorization={authorization}
                    userId={authorization.userId}
                    includeClosed
                />
            </Suspense>
        </div>
    );
}
