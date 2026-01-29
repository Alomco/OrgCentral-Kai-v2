'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AbsenceItem {
    id: string;
    startDate: Date;
    endDate: Date;
    type: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

interface AbsenceCalendarProps {
    absences: AbsenceItem[];
    onDayClick?: (date: Date) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_ARIA_FORMATTER = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let index = firstDayOfWeek - 1; index >= 0; index--) {
        days.push(new Date(year, month, -index));
    }

    // Add days of current month
    for (let index = 1; index <= lastDay.getDate(); index++) {
        days.push(new Date(year, month, index));
    }

    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let index = 1; index <= remainingDays; index++) {
        days.push(new Date(year, month + 1, index));
    }

    return days;
}

function getStatusColor(status: AbsenceItem['status']): string {
    switch (status) {
        case 'approved':
            return 'bg-accent';
        case 'pending':
            return 'bg-secondary';
        case 'rejected':
            return 'bg-destructive';
        case 'cancelled':
            return 'bg-muted-foreground';
        default:
            return 'bg-primary';
    }
}

export function AbsenceCalendar({ absences, onDayClick }: AbsenceCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

    const absencesByDate = useMemo(() => {
        const map = new Map<string, AbsenceItem[]>();
        for (const absence of absences) {
            let current = new Date(absence.startDate);
            const end = new Date(absence.endDate);

            while (current <= end) {
                const key = current.toISOString().slice(0, 10);
                const existing = map.get(key) ?? [];
                existing.push(absence);
                map.set(key, existing);
                current = new Date(current.getTime() + 86400000);
            }
        }
        return map;
    }, [absences]);

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                    {MONTHS[month]} {year}
                </CardTitle>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={previousMonth}
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={nextMonth}
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-px mb-2">
                    {DAYS.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                    {days.map((day, index) => {
                        const isCurrentMonth = day.getMonth() === month;
                        const dateKey = day.toISOString().slice(0, 10);
                        const isToday = dateKey === todayKey;
                        const dayAbsences = absencesByDate.get(dateKey) ?? [];
                        const dayAbsencesCount = dayAbsences.length;
                        const ariaLabel = dayAbsencesCount > 0
                            ? `${DAY_ARIA_FORMATTER.format(day)}, ${String(dayAbsencesCount)} absences`
                            : DAY_ARIA_FORMATTER.format(day);

                        return (
                            <button
                                key={index}
                                type="button"
                                className={cn(
                                    'relative min-h-12 p-1 bg-background text-left transition-colors',
                                    'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:z-10',
                                    !isCurrentMonth && 'text-muted-foreground/50 bg-muted/30',
                                )}
                                onClick={() => onDayClick?.(day)}
                                aria-label={ariaLabel}
                            >
                                <span
                                    className={cn(
                                        'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                                        isToday && 'bg-primary text-primary-foreground font-bold',
                                    )}
                                >
                                    {day.getDate()}
                                </span>
                                {dayAbsencesCount > 0 && (
                                    <div className="flex gap-0.5 mt-1 flex-wrap">
                                        {dayAbsences.slice(0, 3).map((absence) => (
                                            <div
                                                key={absence.id}
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    getStatusColor(absence.status),
                                                )}
                                                title={`${absence.type} (${absence.status})`}
                                            />
                                        ))}
                                        {dayAbsencesCount > 3 && (
                                            <span className="text-[10px] text-muted-foreground">
                                                +{dayAbsencesCount - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        Approved
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-secondary" />
                        Pending
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        Rejected
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
