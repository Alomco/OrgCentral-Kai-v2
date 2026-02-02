import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { getHrReportSummary } from '@/server/use-cases/hr/reports/get-hr-report-summary';
import { renderHrReportPdf } from '@/server/use-cases/hr/reports/hr-report-pdf';

const exportQuerySchema = z.object({
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
});

export interface ExportHrReportControllerResult {
    contentType: string;
    body: string | Buffer;
    fileName: string;
}

function parseQuery(request: Request) {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') ?? 'json';
    const parsed = exportQuerySchema.safeParse({ format });
    if (!parsed.success) {
        throw new Error('Invalid export format.');
    }
    return parsed.data;
}

function toCsv(input: ReturnType<typeof getHrReportSummary> extends Promise<infer T> ? T : never): string {
    const { metrics, generatedAt } = input;
    const rows: [string, string | number][] = [
        ['generatedAt', generatedAt],
        ['leaveSubmitted', metrics.leaveSubmitted],
        ['leaveApproved', metrics.leaveApproved],
        ['leaveUpcoming', metrics.leaveUpcoming],
        ['absencesReported', metrics.absencesReported],
        ['absencesApproved', metrics.absencesApproved],
        ['absencesOpen', metrics.absencesOpen],
        ['timeEntriesPending', metrics.timeEntriesPending],
        ['timeEntriesApproved', metrics.timeEntriesApproved],
        ['totalHoursRecent', metrics.totalHoursRecent],
        ['totalHoursPrev30', metrics.totalHoursPrev30],
        ['trainingCompleted', metrics.trainingCompleted],
        ['trainingInProgress', metrics.trainingInProgress],
        ['trainingDueSoon', metrics.trainingDueSoon],
        ['policyCount', metrics.policyCount],
        ['pendingApprovals', metrics.pendingApprovals],
        ['complianceTotal', metrics.complianceTotal],
        ['complianceOverdue', metrics.complianceOverdue],
        ['complianceExpiringSoon', metrics.complianceExpiringSoon],
        ['compliancePendingReview', metrics.compliancePendingReview],
        ['complianceComplete', metrics.complianceComplete],
        ['complianceCompletedLast30', metrics.complianceCompletedLast30],
        ['complianceCompletedPrev30', metrics.complianceCompletedPrev30],
        ['documentTotal', metrics.documentTotal],
        ['documentRetentionExpiringSoon', metrics.documentRetentionExpiringSoon],
        ['documentAddedLast30', metrics.documentAddedLast30],
    ];

    const lines = ['metric,value'];
    for (const [metric, value] of rows) {
        lines.push(`${metric},${String(value)}`);
    }
    return lines.join('\n');
}

export async function exportHrReportController(request: Request): Promise<ExportHrReportControllerResult> {
    const query = parseQuery(request);

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'api:hr:reports:export',
            action: HR_ACTION.READ,
            resourceType: HR_RESOURCE.HR_REPORTS,
            resourceAttributes: { format: query.format },
        },
    );

    const summary = await getHrReportSummary({ authorization });
    const fileName = `hr-report-${summary.generatedAt.slice(0, 10)}.${query.format}`;

    if (query.format === 'csv') {
        return {
            contentType: 'text/csv; charset=utf-8',
            body: toCsv(summary),
            fileName,
        };
    }

    if (query.format === 'pdf') {
        const buffer = await renderHrReportPdf(summary);
        return {
            contentType: 'application/pdf',
            body: buffer,
            fileName,
        };
    }

    return {
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(summary, null, 2),
        fileName,
    };
}
