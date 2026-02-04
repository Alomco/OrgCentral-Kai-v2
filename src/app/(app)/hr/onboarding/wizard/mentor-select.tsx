'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { FieldError } from '../../_components/field-error';
import type { ManagerOption } from './wizard.types';

const MENTOR_NONE_VALUE = '__none__';

interface MentorSelectProps {
    value?: string;
    error?: string;
    mentors?: ManagerOption[];
    disabled?: boolean;
    onChange: (value?: string) => void;
}

export function MentorSelect({
    value,
    error,
    mentors = [],
    disabled = false,
    onChange,
}: MentorSelectProps) {
    const mentorOptions = mentors.filter((mentor) => mentor.employeeNumber.trim().length > 0);
    const mentorValue = value ?? MENTOR_NONE_VALUE;
    const mentorPlaceholder = mentorOptions.length === 0 ? 'No mentors available' : 'Select mentor';

    return (
        <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="wizard-mentorEmployeeNumber">Mentor (employee number)</Label>
            <Select
                value={mentorValue}
                onValueChange={(selected) =>
                    onChange(selected === MENTOR_NONE_VALUE ? undefined : selected)}
                disabled={disabled}
            >
                <SelectTrigger
                    id="wizard-mentorEmployeeNumber"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'wizard-mentorEmployeeNumber-error' : undefined}
                    className="sm:max-w-xs"
                >
                    <SelectValue placeholder={mentorPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={MENTOR_NONE_VALUE}>No mentor</SelectItem>
                    {mentorOptions.map((mentor) => (
                        <SelectItem key={mentor.employeeNumber} value={mentor.employeeNumber}>
                            <div className="flex flex-col">
                                <span>{mentor.displayName}</span>
                                <span className="text-xs text-muted-foreground">
                                    {mentor.employeeNumber}{mentor.email ? ` | ${mentor.email}` : ''}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError id="wizard-mentorEmployeeNumber-error" message={error} />
            <p className="text-xs text-muted-foreground">
                Assign a mentor to support the employee during onboarding.
            </p>
        </div>
    );
}
