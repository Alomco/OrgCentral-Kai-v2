import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Download, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { EmployeesDirectoryFilters } from './_components/employees-directory-filters';
import { EmployeesDirectoryPanel } from './_components/employees-directory-panel';
import { EmployeesDirectorySkeleton } from './_components/employees-directory-skeleton';
import {
    parseEmployeeDirectoryQuery,
    type EmployeeDirectorySearchParams,
    buildEmployeeDirectoryExportHref,
} from './_components/employee-directory-helpers';

interface HrEmployeesPageProps {
    searchParams: Promise<EmployeeDirectorySearchParams>;
}

export default async function HrEmployeesPage({ searchParams }: HrEmployeesPageProps) {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:employees',
    });

    const params = await searchParams;
    const query = parseEmployeeDirectoryQuery(params);

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
                description="Manage your organization employee records and workforce insights."
                icon={<Users className="h-5 w-5" />}
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={buildEmployeeDirectoryExportHref(query)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/hr/onboarding/new">Onboard employee</Link>
                        </Button>
                    </div>
                )}
            />

            <EmployeesDirectoryFilters query={query} />

            <Suspense fallback={<EmployeesDirectorySkeleton />}>
                <EmployeesDirectoryPanel authorization={authorization} query={query} />
            </Suspense>
        </div>
    );
}
