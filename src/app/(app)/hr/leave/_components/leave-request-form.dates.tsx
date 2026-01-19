'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { FieldError } from '../../_components/field-error';

export function LeaveDateRangeFields({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    isHalfDay,
    onHalfDayChange,
    halfDayLockedToSingleDate,
    startDateErrorId,
    endDateErrorId,
    startDateError,
    endDateError,
    pending,
    focusRingClass,
}: {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    isHalfDay: boolean;
    onHalfDayChange: (next: boolean) => void;
    halfDayLockedToSingleDate: boolean;
    startDateErrorId?: string;
    endDateErrorId?: string;
    startDateError?: string | string[];
    endDateError?: string | string[];
    pending: boolean;
    focusRingClass: string;
}) {
    return (
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,auto]">
            <div className="space-y-1.5">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => onStartDateChange(event.target.value)}
                    placeholder="yyyy-mm-dd"
                    required
                    aria-invalid={startDateErrorId ? 'true' : undefined}
                    aria-describedby={startDateErrorId}
                    className={focusRingClass}
                />
                <FieldError id={startDateErrorId} message={startDateError} />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="endDate">End date</Label>
                <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={halfDayLockedToSingleDate ? startDate : endDate}
                    onChange={(event) => onEndDateChange(event.target.value)}
                    placeholder="yyyy-mm-dd"
                    aria-invalid={endDateErrorId ? 'true' : undefined}
                    aria-describedby={endDateErrorId}
                    readOnly={halfDayLockedToSingleDate}
                    className={focusRingClass}
                />
                <div className="text-xs text-muted-foreground">Half-day locks to the start date.</div>
                <FieldError id={endDateErrorId} message={endDateError} />
            </div>

            <div className="flex flex-col justify-between rounded-lg border bg-card/60 p-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="text-sm font-semibold">Half day</div>
                        <div id="isHalfDay-help" className="text-xs text-muted-foreground">Applies to the start date only.</div>
                    </div>
                    <input type="hidden" name="isHalfDay" value={String(isHalfDay)} />
                    <Switch
                        checked={isHalfDay}
                        onCheckedChange={onHalfDayChange}
                        aria-label="Half day"
                        aria-describedby="isHalfDay-help"
                        disabled={pending}
                        className={`relative h-9 w-16 border border-border/60 ${focusRingClass} data-[state=checked]:bg-primary data-[state=checked]:border-primary/80 data-[state=unchecked]:bg-muted shadow-[inset_0_0_0_1px_oklch(var(--border)/0.25)] after:absolute after:left-1 after:top-1 after:h-7 after:w-7 after:rounded-full after:bg-background after:shadow-sm after:transition-transform data-[state=checked]:after:translate-x-7 data-[state=unchecked]:after:translate-x-0`}
                    />
                </div>
                <div className="mt-3 rounded-md border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    Half-day requests are single-day. Multi-day spans keep full days.
                </div>
            </div>
        </div>
    );
}
