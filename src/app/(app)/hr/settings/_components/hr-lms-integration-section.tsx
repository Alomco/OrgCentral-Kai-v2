'use client';

import type { RefObject } from 'react';
import { GraduationCap } from 'lucide-react';

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

export function LmsIntegrationSection({ pending, state, enabledReference }: IntegrationSectionProps) {
    const lmsProviderNameError = readFieldError(state.fieldErrors, 'lmsProviderName');
    const lmsBaseUrlError = readFieldError(state.fieldErrors, 'lmsBaseUrl');
    const lmsApiTokenLabelError = readFieldError(state.fieldErrors, 'lmsApiTokenLabel');
    const lmsSyncWindowDaysError = readFieldError(state.fieldErrors, 'lmsSyncWindowDays');

    return (
        <>
            <IntegrationSectionHeader
                title="Learning Management System"
                description="Bring training completions and certifications into HR records."
                status={state.integrationStatus.lms}
                provider="lms"
                icon={<GraduationCap className="h-4 w-4" />}
                disabled={!state.integrationStatus.lms.enabled}
            />
            <fieldset disabled={pending} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="lmsEnabled">Enable LMS connector</Label>
                        <p className="text-xs text-muted-foreground">
                            Store provider details now and connect credentials later.
                        </p>
                    </div>
                    <input
                        ref={enabledReference}
                        type="hidden"
                        name="lmsEnabled"
                        value={state.values.lmsEnabled ? 'on' : 'off'}
                    />
                    <p id="lmsEnabled-help" className="sr-only">
                        Toggle LMS integration for HR.
                    </p>
                    <Switch
                        id="lmsEnabled"
                        aria-describedby="lmsEnabled-help"
                        key={state.values.lmsEnabled ? 'lms-on' : 'lms-off'}
                        defaultChecked={state.values.lmsEnabled}
                        onCheckedChange={(checked) => {
                            if (enabledReference.current) {
                                enabledReference.current.value = checked ? 'on' : 'off';
                            }
                        }}
                        aria-label="Enable LMS connector"
                        disabled={pending}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="lmsProviderName">Provider</Label>
                        <Input
                            id="lmsProviderName"
                            name="lmsProviderName"
                            placeholder="Cornerstone, Docebo, Moodle"
                            key={`lms-provider-${state.values.lmsProviderName}`}
                            defaultValue={state.values.lmsProviderName}
                            aria-invalid={lmsProviderNameError ? 'true' : undefined}
                            aria-describedby={lmsProviderNameError ? 'lmsProviderName-error' : undefined}
                        />
                        <FieldError id="lmsProviderName-error" message={lmsProviderNameError} />
                        <p className="text-xs text-muted-foreground">
                            Example: Cornerstone, Docebo, Moodle.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lmsBaseUrl">Base URL</Label>
                        <Input
                            id="lmsBaseUrl"
                            name="lmsBaseUrl"
                            placeholder="https://lms.company.com"
                            key={`lms-url-${state.values.lmsBaseUrl}`}
                            defaultValue={state.values.lmsBaseUrl}
                            aria-invalid={lmsBaseUrlError ? 'true' : undefined}
                            aria-describedby={lmsBaseUrlError ? 'lmsBaseUrl-error' : undefined}
                        />
                        <FieldError id="lmsBaseUrl-error" message={lmsBaseUrlError} />
                        <p className="text-xs text-muted-foreground">
                            Use the URL you log into for training.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lmsApiTokenLabel">API token label</Label>
                        <Input
                            id="lmsApiTokenLabel"
                            name="lmsApiTokenLabel"
                            placeholder="Store token label only"
                            key={`lms-token-${state.values.lmsApiTokenLabel}`}
                            defaultValue={state.values.lmsApiTokenLabel}
                            aria-invalid={lmsApiTokenLabelError ? 'true' : undefined}
                            aria-describedby={lmsApiTokenLabelError ? 'lmsApiTokenLabel-error' : undefined}
                        />
                        <FieldError id="lmsApiTokenLabel-error" message={lmsApiTokenLabelError} />
                        <p className="text-xs text-muted-foreground">
                            Store a label only—tokens are handled securely elsewhere.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lmsSyncWindowDays">Sync window (days)</Label>
                        <Input
                            id="lmsSyncWindowDays"
                            name="lmsSyncWindowDays"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={180}
                            step={1}
                            key={`lms-window-${String(state.values.lmsSyncWindowDays)}`}
                            defaultValue={state.values.lmsSyncWindowDays}
                            aria-invalid={lmsSyncWindowDaysError ? 'true' : undefined}
                            aria-describedby={lmsSyncWindowDaysError ? 'lmsSyncWindowDays-error' : undefined}
                        />
                        <FieldError id="lmsSyncWindowDays-error" message={lmsSyncWindowDaysError} />
                        <p className="text-xs text-muted-foreground">
                            How many days ahead to sync completions.
                        </p>
                    </div>
                </div>
            </fieldset>
        </>
    );
}
