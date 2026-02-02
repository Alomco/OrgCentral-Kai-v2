'use client';

import type { RefObject } from 'react';
import { CalendarDays } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FieldError } from '@/app/(app)/hr/_components/field-error';

import type { HrIntegrationsFormState } from '../integrations-form-state';
import { IntegrationSectionHeader } from './hr-integrations-header';

interface IntegrationSectionProps {
    pending: boolean;
    state: HrIntegrationsFormState;
    enabledReference: RefObject<HTMLInputElement | null>;
}

function readFieldError(
    fieldErrors: HrIntegrationsFormState['fieldErrors'],
    key: keyof HrIntegrationsFormState['values'],
): string | undefined {
    if (!fieldErrors || typeof fieldErrors !== 'object') {
        return undefined;
    }
    const value = fieldErrors[key];
    return typeof value === 'string' ? value : undefined;
}

export function GoogleCalendarSection({ pending, state, enabledReference }: IntegrationSectionProps) {
    const googleCalendarIdError = readFieldError(state.fieldErrors, 'googleCalendarId');
    const googleServiceAccountEmailError = readFieldError(state.fieldErrors, 'googleServiceAccountEmail');
    const googleSyncWindowDaysError = readFieldError(state.fieldErrors, 'googleSyncWindowDays');

    return (
        <>
            <IntegrationSectionHeader
                title="Google Calendar"
                description="Sync approved leave and absences into shared team calendars."
                status={state.integrationStatus.googleCalendar}
                provider="google_calendar"
                icon={<CalendarDays className="h-4 w-4" />}
                disabled={!state.integrationStatus.googleCalendar.enabled}
            />
            <fieldset disabled={pending} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="googleEnabled">Enable Google Calendar</Label>
                        <p className="text-xs text-muted-foreground">
                            Requires service account access to the target calendar.
                        </p>
                    </div>
                    <input
                        ref={enabledReference}
                        type="hidden"
                        name="googleEnabled"
                        value={state.values.googleEnabled ? 'on' : 'off'}
                    />
                    <Switch
                        id="googleEnabled"
                        aria-describedby="googleEnabled-help"
                        key={state.values.googleEnabled ? 'google-on' : 'google-off'}
                        defaultChecked={state.values.googleEnabled}
                        onCheckedChange={(checked) => {
                            if (enabledReference.current) {
                                enabledReference.current.value = checked ? 'on' : 'off';
                            }
                        }}
                        aria-label="Enable Google Calendar connector"
                        disabled={pending}
                    />
                    <p id="googleEnabled-help" className="sr-only">Toggle Google Calendar integration for HR.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="googleCalendarId">Calendar ID</Label>
                        <Input
                            id="googleCalendarId"
                            name="googleCalendarId"
                            placeholder="team-calendar@company.com"
                            key={`google-calendar-${state.values.googleCalendarId}`}
                            defaultValue={state.values.googleCalendarId}
                            aria-invalid={googleCalendarIdError ? 'true' : undefined}
                            aria-describedby={googleCalendarIdError ? 'googleCalendarId-error' : undefined}
                        />
                        <FieldError id="googleCalendarId-error" message={googleCalendarIdError} />
                        <p className="text-xs text-muted-foreground">
                            Use the shared team calendar address.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="googleServiceAccountEmail">Service account email</Label>
                        <Input
                            id="googleServiceAccountEmail"
                            name="googleServiceAccountEmail"
                            placeholder="hr-sync@project.iam.gserviceaccount.com"
                            key={`google-service-${state.values.googleServiceAccountEmail}`}
                            defaultValue={state.values.googleServiceAccountEmail}
                            aria-invalid={googleServiceAccountEmailError ? 'true' : undefined}
                            aria-describedby={googleServiceAccountEmailError ? 'googleServiceAccountEmail-error' : undefined}
                        />
                        <FieldError id="googleServiceAccountEmail-error" message={googleServiceAccountEmailError} />
                        <p className="text-xs text-muted-foreground">
                            Ask your IT admin for the service account email.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="googleSyncWindowDays">Sync window (days)</Label>
                        <Input
                            id="googleSyncWindowDays"
                            name="googleSyncWindowDays"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={90}
                            step={1}
                            key={`google-window-${String(state.values.googleSyncWindowDays)}`}
                            defaultValue={state.values.googleSyncWindowDays}
                            aria-invalid={googleSyncWindowDaysError ? 'true' : undefined}
                            aria-describedby={googleSyncWindowDaysError ? 'googleSyncWindowDays-error' : undefined}
                        />
                        <FieldError id="googleSyncWindowDays-error" message={googleSyncWindowDaysError} />
                        <p className="text-xs text-muted-foreground">
                            How many days ahead to sync leave events.
                        </p>
                    </div>
                </div>
            </fieldset>
        </>
    );
}
