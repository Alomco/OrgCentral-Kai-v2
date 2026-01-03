import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getEmployeeProfileForUi } from '@/server/use-cases/hr/people/get-employee-profile.cached';

import { HrPageHeader } from '../../_components/hr-page-header';
import { HrCardSkeleton } from '../../_components/hr-card-skeleton';
import { HrStatusBadge } from '../../_components/hr-status-badge';
import {
    formatEmployeeName,
    formatEmploymentType,
} from '../_components/employee-formatters';
import { EmployeeDetailContent } from './_components/employee-detail-content';
import { EmployeeDetailTabs, resolveEmployeeDetailTab } from './_components/employee-detail-tabs';

interface EmployeeDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}

export default async function EmployeeDetailPage({ params, searchParams }: EmployeeDetailPageProps) {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:employees:detail',
    });

    const routeParams = await params;
    const { tab } = await searchParams;
    const activeTab = resolveEmployeeDetailTab(tab) ?? 'overview';

    const result = await getEmployeeProfileForUi({
        authorization,
        profileId: routeParams.id,
    });

    const profile = result.profile;
    if (!profile) {
        notFound();
    }

    const title = formatEmployeeName(profile);
    const jobTitle = profile.jobTitle?.trim();
    const description = jobTitle
        ? `${jobTitle} - Employee ${profile.employeeNumber}`
        : `Employee ${profile.employeeNumber}`;

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
                            <Link href="/hr/employees">Employees</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title={title}
                description={description}
                icon={<User className="h-5 w-5" />}
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <HrStatusBadge status={profile.employmentStatus} />
                        <Badge variant="outline">{formatEmploymentType(profile.employmentType)}</Badge>
                    </div>
                )}
            />

            <EmployeeDetailTabs profileId={profile.id} activeTab={activeTab} />

            <Suspense fallback={<HrCardSkeleton variant="table" />}>
                <EmployeeDetailContent authorization={authorization} profile={profile} tab={activeTab} />
            </Suspense>
        </div>
    );
}
