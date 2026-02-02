import Link from 'next/link';
import {
    BarChart3,
    CalendarClock,
    ClipboardCheck,
    GraduationCap,
    ScrollText,
    Timer,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HrSection } from '../../_components/hr-design-system/section';
import { HrStatCard } from '../../_components/hr-design-system/stat-card';
import { StatusBreakdownCard } from './status-breakdown-card';
import { formatCount, type ReportsMetrics } from '../reports-utils';
import type { EmployeeDirectoryStats } from '@/server/use-cases/hr/people/get-employee-directory-stats';
import type { LeaveRequest } from '@/server/types/leave-types';
import type { UnplannedAbsence, TimeEntry } from '@/server/types/hr-ops-types';
export interface ReportsContentProps {
    employeeStats: EmployeeDirectoryStats;
    leaveRequests: LeaveRequest[];
    absences: UnplannedAbsence[];
    timeEntries: TimeEntry[];
    metrics: ReportsMetrics;
}

export function ReportsContent({
    employeeStats,
    leaveRequests,
    absences,
    timeEntries,
    metrics,
}: ReportsContentProps) {
    const trainingTotal = metrics.trainingCompleted + metrics.trainingInProgress;
    const trainingCompletionRate = trainingTotal > 0
        ? Math.round((metrics.trainingCompleted / trainingTotal) * 100)
        : 0;
    const complianceCoverageRate = metrics.complianceTotal > 0
        ? Math.round((metrics.complianceComplete / metrics.complianceTotal) * 100)
        : 0;
    const complianceCompletedDelta = metrics.complianceCompletedPrev30 > 0
        ? Math.round(((metrics.complianceCompletedLast30 - metrics.complianceCompletedPrev30) / metrics.complianceCompletedPrev30) * 100)
        : null;
    const complianceDeltaLabel = complianceCompletedDelta === null
        ? 'N/A'
        : `${complianceCompletedDelta >= 0 ? '+' : ''}${String(complianceCompletedDelta)}%`;
    const absenceRate = employeeStats.active > 0
        ? Math.round((metrics.absencesOpen / employeeStats.active) * 100)
        : 0;

    return (
        <>
            <HrSection
                title="Organization pulse"
                description="Quick look at headcount, approvals, and activity volume."
                icon={<Users className="h-4 w-4" />}
            >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <HrStatCard
                        label="Active employees"
                        value={formatCount(employeeStats.active)}
                        icon={<Users className="h-5 w-5" />}
                        accentColor="primary"
                    />
                    <HrStatCard
                        label="Pending approvals"
                        value={formatCount(metrics.pendingApprovals)}
                        icon={<ClipboardCheck className="h-5 w-5" />}
                        accentColor="warning"
                    />
                    <HrStatCard
                        label="Upcoming leave (30d)"
                        value={formatCount(metrics.leaveUpcoming)}
                        icon={<CalendarClock className="h-5 w-5" />}
                        accentColor="accent"
                    />
                    <HrStatCard
                        label="Open absences"
                        value={formatCount(metrics.absencesOpen)}
                        icon={<CalendarClock className="h-5 w-5" />}
                        accentColor="warning"
                    />
                    <HrStatCard
                        label="Hours logged (30d)"
                        value={formatCount(Math.round(metrics.totalHoursRecent))}
                        icon={<Timer className="h-5 w-5" />}
                        accentColor="success"
                    />
                    <HrStatCard
                        label="Training due soon"
                        value={formatCount(metrics.trainingDueSoon)}
                        icon={<GraduationCap className="h-5 w-5" />}
                        accentColor="accent"
                    />
                    <HrStatCard
                        label="Compliance overdue"
                        value={formatCount(metrics.complianceOverdue)}
                        icon={<ClipboardCheck className="h-5 w-5" />}
                        accentColor="warning"
                    />
                    <HrStatCard
                        label="Docs retention due"
                        value={formatCount(metrics.documentRetentionExpiringSoon)}
                        icon={<ScrollText className="h-5 w-5" />}
                        accentColor="accent"
                    />
                    <HrStatCard
                        label="Vault documents"
                        value={formatCount(metrics.documentTotal)}
                        icon={<ScrollText className="h-5 w-5" />}
                        accentColor="primary"
                    />
                </div>
            </HrSection>

            <HrSection
                title="Approval pipeline"
                description="Pending items that require review across modules."
                icon={<ClipboardCheck className="h-4 w-4" />}
            >
                <div className="grid gap-4 lg:grid-cols-4">
                    <StatusBreakdownCard
                        title="Leave requests"
                        description="Submitted and approved requests."
                        total={leaveRequests.length}
                        rows={[
                            { label: 'Submitted', count: metrics.leaveSubmitted, tone: 'warning' },
                            { label: 'Approved', count: metrics.leaveApproved, tone: 'success' },
                        ]}
                    />
                    <StatusBreakdownCard
                        title="Absences"
                        description="Reported and approved absences."
                        total={absences.length}
                        rows={[
                            { label: 'Reported', count: metrics.absencesReported, tone: 'warning' },
                            { label: 'Approved', count: metrics.absencesApproved, tone: 'success' },
                        ]}
                    />
                    <StatusBreakdownCard
                        title="Time entries"
                        description="Completed and approved timesheets."
                        total={timeEntries.length}
                        rows={[
                            { label: 'Pending approval', count: metrics.timeEntriesPending, tone: 'warning' },
                            { label: 'Approved', count: metrics.timeEntriesApproved, tone: 'success' },
                        ]}
                    />
                    <StatusBreakdownCard
                        title="Compliance"
                        description="Pending review and completed items."
                        total={metrics.complianceTotal}
                        rows={[
                            { label: 'Pending review', count: metrics.compliancePendingReview, tone: 'warning' },
                            { label: 'Complete', count: metrics.complianceComplete, tone: 'success' },
                        ]}
                    />
                </div>
            </HrSection>

            <HrSection
                title="Learning and policy coverage"
                description="Training progress and active policy inventory."
                icon={<GraduationCap className="h-4 w-4" />}
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <GraduationCap className="h-4 w-4" />
                                Training status
                            </CardTitle>
                            <CardDescription>Track completion and in-progress enrollments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary">{formatCount(metrics.trainingCompleted)} completed</Badge>
                                <Badge variant="outline">{formatCount(metrics.trainingInProgress)} in progress</Badge>
                                <Badge variant="outline">{formatCount(metrics.trainingDueSoon)} expiring soon</Badge>
                            </div>
                            <Separator />
                            <div className="text-sm text-muted-foreground">
                                Training activity is based on enrollments captured in the HR training module.
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ScrollText className="h-4 w-4" />
                                Policy library
                            </CardTitle>
                            <CardDescription>Active HR policies tracked for the organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-3xl font-semibold">{formatCount(metrics.policyCount)}</div>
                            <p className="text-sm text-muted-foreground">
                                Keep policy acknowledgments current for compliance readiness.
                            </p>
                            <Link href="/hr/policies" className="text-sm font-medium text-primary">
                                View policies
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </HrSection>

            <HrSection
                title="Cross-module insights"
                description="Signals that connect training, compliance, and absence trends."
                icon={<BarChart3 className="h-4 w-4" />}
            >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <HrStatCard
                        label="Training completion rate"
                        value={`${String(trainingCompletionRate)}%`}
                        icon={<GraduationCap className="h-5 w-5" />}
                        accentColor="success"
                    />
                    <HrStatCard
                        label="Compliance coverage"
                        value={`${String(complianceCoverageRate)}%`}
                        icon={<ClipboardCheck className="h-5 w-5" />}
                        accentColor="accent"
                    />
                    <HrStatCard
                        label="Compliance completion trend"
                        value={complianceDeltaLabel}
                        icon={<BarChart3 className="h-5 w-5" />}
                        accentColor={complianceCompletedDelta !== null && complianceCompletedDelta < 0 ? 'warning' : 'success'}
                    />
                    <HrStatCard
                        label="Open absence rate"
                        value={`${String(absenceRate)}%`}
                        icon={<CalendarClock className="h-5 w-5" />}
                        accentColor="warning"
                    />
                    <HrStatCard
                        label="Documents added (30d)"
                        value={formatCount(metrics.documentAddedLast30)}
                        icon={<ScrollText className="h-5 w-5" />}
                        accentColor="accent"
                    />
                </div>
            </HrSection>
        </>
    );
}
