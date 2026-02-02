import type { Metadata } from 'next';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';
import { BarChart3 } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { HrPageHeader } from '../_components/hr-page-header';
import { ReportsContent } from './_components/reports-content';
import { buildReportsMetrics } from './reports-utils';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getEmployeeDirectoryStatsForUi } from '@/server/use-cases/hr/people/get-employee-directory-stats.cached';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';
import { getAbsencesForUi } from '@/server/use-cases/hr/absences/get-absences.cached';
import { getTimeEntriesForUi } from '@/server/use-cases/hr/time-tracking/get-time-entries.cached';
import { getTrainingRecordsForUi } from '@/server/use-cases/hr/training/get-training-records.cached';
import { listHrPoliciesForUi } from '@/server/use-cases/hr/policies/list-hr-policies.cached';
import { listComplianceItemsForOrgForUi } from '@/server/use-cases/hr/compliance/list-compliance-items-for-org.cached';
import { listDocumentsForUi } from '@/server/use-cases/records/documents/list-documents.cached';

export const metadata: Metadata = {
    title: 'HR Reports',
    description: 'Cross-module HR analytics and reporting.',
};

export default async function HrReportsPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:reports',
        },
    );

    const [
        employeeStatsResult,
        leaveResult,
        absencesResult,
        timeEntriesResult,
        trainingResult,
        policyResult,
        complianceResult,
        documentResult,
    ] = await Promise.all([
        getEmployeeDirectoryStatsForUi({ authorization }).catch(() => ({
            total: 0,
            active: 0,
            onLeave: 0,
            newThisMonth: 0,
        })),
        getLeaveRequestsForUi({ authorization }).catch(() => ({ requests: [] })),
        getAbsencesForUi({ authorization }).catch(() => ({ absences: [] })),
        getTimeEntriesForUi({ authorization }).catch(() => ({ entries: [] })),
        getTrainingRecordsForUi({ authorization }).catch(() => ({ records: [] })),
        listHrPoliciesForUi({ authorization }).catch(() => ({ policies: [] })),
        listComplianceItemsForOrgForUi({ authorization }).catch(() => ({ items: [] })),
        listDocumentsForUi({ authorization }).catch(() => ({ documents: [] })),
    ]);

    const employeeStats = employeeStatsResult;
    const leaveRequests = leaveResult.requests;
    const absences = absencesResult.absences;
    const timeEntries = timeEntriesResult.entries;
    const trainingRecords = trainingResult.records;
    const policies = policyResult.policies;
    const complianceItems = complianceResult.items;
    const documents = documentResult.documents;

    const metrics = buildReportsMetrics({
        employeeStats,
        leaveRequests,
        absences,
        timeEntries,
        trainingRecords,
        policies,
        complianceItems,
        documents,
    });

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
                        <BreadcrumbPage>Reports</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="HR reports"
                description="Cross-module KPIs for workforce, time off, time tracking, and learning."
                icon={<BarChart3 className="h-5 w-5" />}
                actions={(
                    <>
                        <Button asChild variant="outline">
                            <Link href="/api/hr/reports/export?format=csv" download>
                                Export CSV
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/api/hr/reports/export?format=pdf" download>
                                Export PDF
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/api/hr/reports/export?format=json" download>
                                Export JSON
                            </Link>
                        </Button>
                    </>
                )}
            />
            <ReportsContent
                employeeStats={employeeStats}
                leaveRequests={leaveRequests}
                absences={absences}
                timeEntries={timeEntries}
                metrics={metrics}
            />
        </div>
    );
}
