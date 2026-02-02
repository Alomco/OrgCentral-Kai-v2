'use client';

import type { RefObject } from 'react';
import { Cloud } from 'lucide-react';

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

export function MicrosoftCalendarSection({ pending, state, enabledReference }: IntegrationSectionProps) {
    const m365TenantIdError = readFieldError(state.fieldErrors, 'm365TenantId');
    const m365CalendarIdError = readFieldError(state.fieldErrors, 'm365CalendarId');
    const m365SyncWindowDaysError = readFieldError(state.fieldErrors, 'm365SyncWindowDays');

    return (
        <>
            <IntegrationSectionHeader
                title="Microsoft 365 Calendar"
                description="Push leave events to M365 shared calendars for managers."
                status={state.integrationStatus.m365Calendar}
                provider="m365_calendar"
                icon={<Cloud className="h-4 w-4" />}
                disabled={!state.integrationStatus.m365Calendar.enabled}
            />
            <fieldset disabled={pending} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="m365Enabled">Enable Microsoft 365</Label>
                        <p className="text-xs text-muted-foreground">
                            Requires an Azure tenant ID and mailbox calendar access.
                        </p>
                    </div>
                    <input
                        ref={enabledReference}
                        type="hidden"
                        name="m365Enabled"
                        value={state.values.m365Enabled ? 'on' : 'off'}
                    />
                    <Switch
                        id="m365Enabled"
                        aria-describedby="m365Enabled-help"
                        key={state.values.m365Enabled ? 'm365-on' : 'm365-off'}
                        defaultChecked={state.values.m365Enabled}
                        onCheckedChange={(checked) => {
                            if (enabledReference.current) {
                                enabledReference.current.value = checked ? 'on' : 'off';
                            }
                        }}
                        aria-label="Enable Microsoft 365 connector"
                        disabled={pending}
                    />
                    <p id="m365Enabled-help" className="sr-only">Toggle Microsoft 365 calendar integration for HR.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="m365TenantId">Tenant ID</Label>
                        <Input
                            id="m365TenantId"
                            name="m365TenantId"
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            key={`m365-tenant-${state.values.m365TenantId}`}
                            defaultValue={state.values.m365TenantId}
                            aria-invalid={m365TenantIdError ? 'true' : undefined}
                            aria-describedby={m365TenantIdError ? 'm365TenantId-error' : undefined}
                        />
                        <FieldError id="m365TenantId-error" message={m365TenantIdError} />
                        <p className="text-xs text-muted-foreground">
                            Provided by your Microsoft 365 admin.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m365CalendarId">Calendar ID</Label>
                        <Input
                            id="m365CalendarId"
                            name="m365CalendarId"
                            placeholder="Shared calendar mailbox"
                            key={`m365-calendar-${state.values.m365CalendarId}`}
                            defaultValue={state.values.m365CalendarId}
                            aria-invalid={m365CalendarIdError ? 'true' : undefined}
                            aria-describedby={m365CalendarIdError ? 'm365CalendarId-error' : undefined}
                        />
                        <FieldError id="m365CalendarId-error" message={m365CalendarIdError} />
                        <p className="text-xs text-muted-foreground">
                            Use the shared mailbox calendar.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m365SyncWindowDays">Sync window (days)</Label>
                        <Input
                            id="m365SyncWindowDays"
                            name="m365SyncWindowDays"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={90}
                            step={1}
                            key={`m365-window-${String(state.values.m365SyncWindowDays)}`}
                            defaultValue={state.values.m365SyncWindowDays}
                            aria-invalid={m365SyncWindowDaysError ? 'true' : undefined}
                            aria-describedby={m365SyncWindowDaysError ? 'm365SyncWindowDays-error' : undefined}
                        />
                        <FieldError id="m365SyncWindowDays-error" message={m365SyncWindowDaysError} />
                        <p className="text-xs text-muted-foreground">
                            How many days ahead to sync leave events.
                        </p>
                    </div>
                </div>
            </fieldset>
        </>
    );
}
