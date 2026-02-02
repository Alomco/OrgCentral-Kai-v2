import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getEmployeeDirectoryStatsForUi } from '@/server/use-cases/hr/people/get-employee-directory-stats.cached';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';
import { getAbsencesForUi } from '@/server/use-cases/hr/absences/get-absences.cached';
import { getTimeEntriesForUi } from '@/server/use-cases/hr/time-tracking/get-time-entries.cached';
import { getTrainingRecordsForUi } from '@/server/use-cases/hr/training/get-training-records.cached';
import { listHrPoliciesForUi } from '@/server/use-cases/hr/policies/list-hr-policies.cached';
import { listComplianceItemsForOrgForUi } from '@/server/use-cases/hr/compliance/list-compliance-items-for-org.cached';
import { listDocumentsForUi } from '@/server/use-cases/records/documents/list-documents.cached';
import { buildReportsMetrics, type ReportsMetrics } from './report-metrics';

export interface HrReportSummaryInput {
    authorization: RepositoryAuthorizationContext;
    now?: Date;
}

export interface HrReportSummaryResult {
    generatedAt: string;
    metrics: ReportsMetrics;
}

export async function getHrReportSummary(
    input: HrReportSummaryInput,
): Promise<HrReportSummaryResult> {
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
        getEmployeeDirectoryStatsForUi({ authorization: input.authorization }).catch(() => ({
            total: 0,
            active: 0,
            onLeave: 0,
            newThisMonth: 0,
        })),
        getLeaveRequestsForUi({ authorization: input.authorization }).catch(() => ({ requests: [] })),
        getAbsencesForUi({ authorization: input.authorization }).catch(() => ({ absences: [] })),
        getTimeEntriesForUi({ authorization: input.authorization }).catch(() => ({ entries: [] })),
        getTrainingRecordsForUi({ authorization: input.authorization }).catch(() => ({ records: [] })),
        listHrPoliciesForUi({ authorization: input.authorization }).catch(() => ({ policies: [] })),
        listComplianceItemsForOrgForUi({ authorization: input.authorization }).catch(() => ({ items: [] })),
        listDocumentsForUi({ authorization: input.authorization }).catch(() => ({ documents: [] })),
    ]);

    const metrics = buildReportsMetrics({
        employeeStats: employeeStatsResult,
        leaveRequests: leaveResult.requests,
        absences: absencesResult.absences,
        timeEntries: timeEntriesResult.entries,
        trainingRecords: trainingResult.records,
        policies: policyResult.policies,
        complianceItems: complianceResult.items,
        documents: documentResult.documents,
        now: input.now,
    });

    return {
        generatedAt: (input.now ?? new Date()).toISOString(),
        metrics,
    };
}
