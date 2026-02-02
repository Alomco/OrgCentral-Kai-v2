import { CalendarClock, ClipboardCheck, GraduationCap, HeartPulse } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';
import { getAbsences } from '@/server/use-cases/hr/absences/get-absences';
import { PrismaUnplannedAbsenceRepository } from '@/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository';
import { getTrainingRecordsForUi } from '@/server/use-cases/hr/training/get-training-records.cached';
import { getPerformanceReviewsForUi } from '@/server/use-cases/hr/performance/get-performance-reviews.cached';
import { listAbsenceTypeConfigsForUi } from '@/server/use-cases/hr/absences/list-absence-type-configs.cached';
import { formatHumanDate } from '@/app/(app)/hr/_components/format-date';

interface TimelineEvent {
    id: string;
    date: Date;
    title: string;
    description: string;
    badge: string;
    icon: typeof CalendarClock;
}

function normalizeDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export async function EmployeeTimelineTab({
    authorization,
    profile,
}: {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}) {
    const [leaveResult, absencesResult, trainingResult, reviewResult, absenceTypesResult] = await Promise.all([
        getLeaveRequestsForUi({ authorization, employeeId: profile.id }).catch(() => ({ requests: [] })),
        getAbsences(
            { absenceRepository: new PrismaUnplannedAbsenceRepository() },
            { authorization, filters: { userId: profile.userId } },
        ).catch(() => ({ absences: [] })),
        getTrainingRecordsForUi({ authorization, userId: profile.userId }).catch(() => ({ records: [] })),
        getPerformanceReviewsForUi({ authorization, userId: profile.userId }).catch(() => ({ reviews: [] })),
        listAbsenceTypeConfigsForUi({ authorization }).catch(() => ({ types: [] })),
    ]);

    const absenceTypeLabels = new Map(
        absenceTypesResult.types.map((type) => [type.id, type.label]),
    );

    const events: TimelineEvent[] = [];

    for (const request of leaveResult.requests) {
        const date = normalizeDate(request.startDate);
        if (!date) {
            continue;
        }
        events.push({
            id: `leave-${request.id}`,
            date,
            title: 'Leave request',
            description: `${request.leaveType} (${request.status})`,
            badge: 'Leave',
            icon: CalendarClock,
        });
    }

    for (const absence of absencesResult.absences) {
        const date = normalizeDate(absence.startDate);
        if (!date) {
            continue;
        }
        events.push({
            id: `absence-${absence.id}`,
            date,
            title: 'Absence reported',
            description: `${absenceTypeLabels.get(absence.typeId) ?? absence.typeId} (${absence.status})`,
            badge: 'Absence',
            icon: HeartPulse,
        });
    }

    for (const record of trainingResult.records) {
        const date = normalizeDate(record.startDate);
        if (!date) {
            continue;
        }
        events.push({
            id: `training-${record.id}`,
            date,
            title: 'Training activity',
            description: `${record.courseName} (${record.status})`,
            badge: 'Training',
            icon: GraduationCap,
        });
    }

    for (const review of reviewResult.reviews) {
        const date = normalizeDate(review.scheduledDate);
        if (!date) {
            continue;
        }
        events.push({
            id: `review-${review.id}`,
            date,
            title: 'Performance review',
            description: `Status: ${review.status}`,
            badge: 'Performance',
            icon: ClipboardCheck,
        });
    }

    const sortedEvents = events.sort((left, right) => right.date.getTime() - left.date.getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Employee timeline</CardTitle>
                <CardDescription>Cross-module activity for this employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedEvents.length > 0 ? (
                    <div className="space-y-4">
                        {sortedEvents.slice(0, 20).map((event) => (
                            <div key={event.id} className="flex gap-3">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-muted/40">
                                    <event.icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium truncate">{event.title}</p>
                                        <Badge variant="outline" className="text-xs">
                                            {event.badge}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                                        {event.description}
                                    </p>
                                </div>
                                <div className="shrink-0 text-xs text-muted-foreground">
                                    {formatHumanDate(event.date)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No timeline activity recorded yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
