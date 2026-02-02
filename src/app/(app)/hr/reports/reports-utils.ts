import type { HRPolicy, UnplannedAbsence, TimeEntry } from '@/server/types/hr-ops-types';
import type { LeaveRequest } from '@/server/types/leave-types';
import type { TrainingRecord } from '@/server/types/hr-types';
import type { EmployeeDirectoryStats } from '@/server/use-cases/hr/people/get-employee-directory-stats';
import type { ComplianceLogItem } from '@/server/types/compliance-types';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';

const DAY_MS = 1000 * 60 * 60 * 24;

function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isWithin(date: Date | null, from: Date, to: Date): boolean {
    if (!date) {
        return false;
    }
    return date >= from && date <= to;
}

export function formatCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

function coerceNumber(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === 'object' && 'toNumber' in value) {
        try {
            const parsed = (value as { toNumber: () => number }).toNumber();
            return Number.isFinite(parsed) ? parsed : 0;
        } catch {
            return 0;
        }
    }
    return 0;
}

function normalizeTrainingStatus(status: string | null | undefined): 'completed' | 'in_progress' | 'other' {
    if (!status) {
        return 'other';
    }
    const normalized = status.trim().toLowerCase();
    if (normalized.includes('complete')) {
        return 'completed';
    }
    if (normalized.includes('progress') || normalized.includes('enrolled') || normalized.includes('started')) {
        return 'in_progress';
    }
    return 'other';
}

export interface ReportsMetrics {
    leaveSubmitted: number;
    leaveApproved: number;
    leaveUpcoming: number;
    absencesReported: number;
    absencesApproved: number;
    absencesOpen: number;
    timeEntriesPending: number;
    timeEntriesApproved: number;
    totalHoursRecent: number;
    totalHoursPrev30: number;
    trainingCompleted: number;
    trainingInProgress: number;
    trainingDueSoon: number;
    policyCount: number;
    pendingApprovals: number;
    complianceTotal: number;
    complianceOverdue: number;
    complianceExpiringSoon: number;
    compliancePendingReview: number;
    complianceComplete: number;
    complianceCompletedLast30: number;
    complianceCompletedPrev30: number;
    documentTotal: number;
    documentRetentionExpiringSoon: number;
    documentAddedLast30: number;
}

export function buildReportsMetrics(input: {
    employeeStats: EmployeeDirectoryStats;
    leaveRequests: LeaveRequest[];
    absences: UnplannedAbsence[];
    timeEntries: TimeEntry[];
    trainingRecords: TrainingRecord[];
    policies: HRPolicy[];
    complianceItems: ComplianceLogItem[];
    documents: DocumentVaultRecord[];
    now?: Date;
}): ReportsMetrics {
    const now = input.now ?? new Date();
    const last30Days = new Date(now.getTime() - 30 * DAY_MS);
    const next30Days = new Date(now.getTime() + 30 * DAY_MS);
    const previous30Days = new Date(now.getTime() - 60 * DAY_MS);

    const leaveSubmitted = input.leaveRequests.filter((request) => request.status === 'submitted').length;
    const leaveApproved = input.leaveRequests.filter((request) => request.status === 'approved').length;
    const leaveUpcoming = input.leaveRequests.filter((request) => {
        if (request.status === 'rejected' || request.status === 'cancelled') {
            return false;
        }
        return isWithin(toDate(request.startDate), now, next30Days);
    }).length;

    const absencesReported = input.absences.filter((absence) => absence.status === 'REPORTED').length;
    const absencesApproved = input.absences.filter((absence) => absence.status === 'APPROVED').length;
    const absencesOpen = input.absences.filter(
        (absence) => absence.status !== 'CLOSED' && absence.status !== 'CANCELLED' && absence.status !== 'REJECTED',
    ).length;

    const timeEntriesPending = input.timeEntries.filter((entry) => entry.status === 'COMPLETED').length;
    const timeEntriesApproved = input.timeEntries.filter((entry) => entry.status === 'APPROVED').length;
    const timeEntriesRecent = input.timeEntries.filter((entry) => isWithin(toDate(entry.date), last30Days, now));
    const totalHoursRecent = timeEntriesRecent.reduce((sum, entry) => sum + coerceNumber(entry.totalHours), 0);
    const timeEntriesPrevious = input.timeEntries.filter((entry) => isWithin(toDate(entry.date), new Date(now.getTime() - 60 * DAY_MS), last30Days));
    const totalHoursPrevious30 = timeEntriesPrevious.reduce((sum, entry) => sum + coerceNumber(entry.totalHours), 0);

    const trainingCompleted = input.trainingRecords.filter(
        (record) => normalizeTrainingStatus(record.status) === 'completed',
    ).length;
    const trainingInProgress = input.trainingRecords.filter(
        (record) => normalizeTrainingStatus(record.status) === 'in_progress',
    ).length;
    const trainingDueSoon = input.trainingRecords.filter((record) =>
        isWithin(toDate(record.expiryDate ?? null), now, next30Days),
    ).length;

    const policyCount = input.policies.length;
    const pendingApprovals = leaveSubmitted + absencesReported + timeEntriesPending;

    const complianceTotal = input.complianceItems.length;
    const compliancePendingReview = input.complianceItems.filter((item) => item.status === 'PENDING_REVIEW').length;
    const complianceComplete = input.complianceItems.filter((item) => item.status === 'COMPLETE').length;
    const complianceOverdue = input.complianceItems.filter((item) => {
        if (!item.dueDate) {
            return false;
        }
        return item.dueDate < now && item.status !== 'COMPLETE';
    }).length;
    const complianceExpiringSoon = input.complianceItems.filter((item) =>
        isWithin(item.dueDate ?? null, now, next30Days),
    ).length;
    const complianceCompletedLast30 = input.complianceItems.filter((item) =>
        isWithin(toDate(item.completedAt ?? null), last30Days, now),
    ).length;
    const complianceCompletedPrevious30 = input.complianceItems.filter((item) =>
        isWithin(toDate(item.completedAt ?? null), previous30Days, last30Days),
    ).length;

    const documentTotal = input.documents.length;
    const documentRetentionExpiringSoon = input.documents.filter((document_) =>
        isWithin(toDate(document_.retentionExpires ?? null), now, next30Days),
    ).length;
    const documentAddedLast30 = input.documents.filter((document_) =>
        isWithin(toDate(document_.createdAt), last30Days, now),
    ).length;

    return {
        leaveSubmitted,
        leaveApproved,
        leaveUpcoming,
        absencesReported,
        absencesApproved,
        absencesOpen,
        timeEntriesPending,
        timeEntriesApproved,
        totalHoursRecent,
        totalHoursPrev30: totalHoursPrevious30,
        trainingCompleted,
        trainingInProgress,
        trainingDueSoon,
        policyCount,
        pendingApprovals,
        complianceTotal,
        complianceOverdue,
        complianceExpiringSoon,
        compliancePendingReview,
        complianceComplete,
        complianceCompletedLast30,
        complianceCompletedPrev30: complianceCompletedPrevious30,
        documentTotal,
        documentRetentionExpiringSoon,
        documentAddedLast30,
    };
}
