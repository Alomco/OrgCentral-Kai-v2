import type { JSX } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TeamCalendarAbsence {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
}

export function TeamCalendarPeek({ absences }: { absences: TeamCalendarAbsence[] }): JSX.Element {
    if (absences.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Team calendar</CardTitle>
                    <CardDescription>Next 3 weeks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div>No upcoming team absences in the next 3 weeks.</div>
                    <div className="text-xs">Team = your manager&apos;s reporting line. New requests will appear here after submission.</div>
                </CardContent>
            </Card>
        );
    }

    const overlapSummaries = summarizeOverlaps(absences);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team calendar</CardTitle>
                <CardDescription>Next 3 weeks overlaps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{overlapSummaries.totalOverlaps} overlaps</Badge>
                    <Badge variant="outline">{overlapSummaries.daysWithOverlaps.length} affected days</Badge>
                    <span className="min-w-0 break-words">Peak day: {overlapSummaries.peakDay.label} ({overlapSummaries.peakDay.count} people away)</span>
                </div>
                {absences.map((absence) => (
                    <div key={absence.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                        <div className="min-w-0">
                            <div className="font-medium truncate">Employee {absence.userId}</div>
                            <div className="text-sm text-muted-foreground">
                                {formatRange(absence.startDate, absence.endDate)}
                            </div>
                            {absence.reason ? (
                                <div className="text-xs text-muted-foreground line-clamp-2 break-words">
                                    {absence.reason}
                                </div>
                            ) : null}
                        </div>
                        <Badge variant="outline" className="shrink-0">Away</Badge>
                    </div>
                ))}
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <div className="font-medium">Overlap awareness</div>
                    <div className="text-muted-foreground">
                        Avoid scheduling large meetings on peak days. Coordinate cover if your dates coincide with high overlap dates above.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function formatRange(from: Date, to: Date): string {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return `${fmt(from)} – ${fmt(to)}`;
}

function summarizeOverlaps(absences: { startDate: Date; endDate: Date; userId: string }[]) {
    const dayMap = new Map<string, number>();
    for (const absence of absences) {
        const current = new Date(absence.startDate);
        const end = new Date(absence.endDate);
        while (current <= end) {
            const key = current.toISOString().slice(0, 10);
            dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
            current.setDate(current.getDate() + 1);
        }
    }

    const daysWithOverlaps = Array.from(dayMap.entries())
        .filter(([, count]) => count > 1)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => (a.day < b.day ? -1 : 1));

    const peakDay = daysWithOverlaps.reduce((accumulator, current) => (current.count > accumulator.count ? current : accumulator), { day: '—', count: 0 });

    return {
        totalOverlaps: daysWithOverlaps.reduce((sum, item) => sum + item.count, 0),
        daysWithOverlaps,
        peakDay: {
            label: peakDay.day === '—' ? 'None' : peakDay.day,
            count: peakDay.count,
        },
    } as const;
}
