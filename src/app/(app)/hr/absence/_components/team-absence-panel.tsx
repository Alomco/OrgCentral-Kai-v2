import { Users, Calendar } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TeamMemberAbsence {
    id: string;
    employeeId: string;
    employeeName: string;
    type: string;
    startDate: Date;
    endDate: Date;
    status: 'approved' | 'pending';
}

interface TeamAbsencePanelProps {
    teamAbsences: TeamMemberAbsence[];
    teamSize: number;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatDateRange(start: Date, end: Date): string {
    const startString = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    const endString = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    if (startString === endString) { return startString; }
    return `${startString} - ${endString}`;
}

function isCurrentlyAway(absence: TeamMemberAbsence): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(absence.startDate);
    const end = new Date(absence.endDate);
    return today >= start && today <= end && absence.status === 'approved';
}

export function TeamAbsencePanel({ teamAbsences, teamSize }: TeamAbsencePanelProps) {
    const currentlyAway = teamAbsences.filter(isCurrentlyAway);
    const upcoming = teamAbsences
        .filter((a) => a.status === 'approved' && new Date(a.startDate) > new Date())
        .slice(0, 5);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Absences
                    </CardTitle>
                    <CardDescription>
                        {currentlyAway.length} of {teamSize} team members currently away
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Currently Away */}
                {currentlyAway.length > 0 ? (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            Currently Away
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {currentlyAway.map((absence) => (
                                <Link
                                    key={absence.id}
                                    href={`/hr/employees/${absence.employeeId}`}
                                    className="flex min-w-0 items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-sm transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                >
                                    <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[10px]">
                                            {getInitials(absence.employeeName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium max-w-[8rem] truncate">
                                        {absence.employeeName}
                                    </span>
                                    <Badge variant="outline" className="max-w-[7rem] truncate text-xs">
                                        {absence.type}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Upcoming */}
                {upcoming.length > 0 ? (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            Upcoming
                        </p>
                        <div className="space-y-2">
                            {upcoming.map((absence) => (
                                <div
                                    key={absence.id}
                                    className="flex items-center justify-between rounded-lg border p-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                            <AvatarFallback className="text-xs">
                                                {getInitials(absence.employeeName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {absence.employeeName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {absence.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {formatDateRange(absence.startDate, absence.endDate)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {currentlyAway.length === 0 && upcoming.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-medium">Full Team Available</p>
                        <p className="text-xs text-muted-foreground">
                            No team members are currently away or have upcoming absences
                        </p>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
