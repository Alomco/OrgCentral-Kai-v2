import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

import type { HrReportSummaryResult } from './get-hr-report-summary';

const styles = StyleSheet.create({
    page: {
        padding: 32,
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: '#111827',
    },
    title: {
        fontSize: 18,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        marginTop: 12,
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
    },
    label: {
        color: '#374151',
    },
    value: {
        fontWeight: 600,
    },
});

function formatValue(value: number | string): string {
    if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US').format(value);
    }
    return value;
}

function buildRows(summary: HrReportSummaryResult) {
    const { metrics } = summary;
    return [
        { label: 'Leave submitted', value: metrics.leaveSubmitted },
        { label: 'Leave approved', value: metrics.leaveApproved },
        { label: 'Leave upcoming', value: metrics.leaveUpcoming },
        { label: 'Absences reported', value: metrics.absencesReported },
        { label: 'Absences approved', value: metrics.absencesApproved },
        { label: 'Absences open', value: metrics.absencesOpen },
        { label: 'Time entries pending', value: metrics.timeEntriesPending },
        { label: 'Time entries approved', value: metrics.timeEntriesApproved },
        { label: 'Hours logged (30d)', value: Math.round(metrics.totalHoursRecent) },
        { label: 'Hours logged (prev 30d)', value: Math.round(metrics.totalHoursPrev30) },
        { label: 'Training completed', value: metrics.trainingCompleted },
        { label: 'Training in progress', value: metrics.trainingInProgress },
        { label: 'Training due soon', value: metrics.trainingDueSoon },
        { label: 'Policies', value: metrics.policyCount },
        { label: 'Pending approvals', value: metrics.pendingApprovals },
        { label: 'Compliance total', value: metrics.complianceTotal },
        { label: 'Compliance overdue', value: metrics.complianceOverdue },
        { label: 'Compliance expiring', value: metrics.complianceExpiringSoon },
        { label: 'Compliance pending review', value: metrics.compliancePendingReview },
        { label: 'Compliance complete', value: metrics.complianceComplete },
        { label: 'Compliance completed (30d)', value: metrics.complianceCompletedLast30 },
        { label: 'Compliance completed (prev 30d)', value: metrics.complianceCompletedPrev30 },
        { label: 'Documents total', value: metrics.documentTotal },
        { label: 'Documents retention due', value: metrics.documentRetentionExpiringSoon },
        { label: 'Documents added (30d)', value: metrics.documentAddedLast30 },
    ];
}

export async function renderHrReportPdf(summary: HrReportSummaryResult): Promise<Buffer> {
    const rows = buildRows(summary);

    const document_ = (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>HR report summary</Text>
                <Text style={styles.subtitle}>Generated: {summary.generatedAt}</Text>

                <Text style={styles.sectionTitle}>Metrics</Text>
                {rows.map((row) => (
                    <View style={styles.row} key={row.label}>
                        <Text style={styles.label}>{row.label}</Text>
                        <Text style={styles.value}>{formatValue(row.value)}</Text>
                    </View>
                ))}
            </Page>
        </Document>
    );

    const buffer = await renderToBuffer(document_);
    return Buffer.from(buffer);
}
