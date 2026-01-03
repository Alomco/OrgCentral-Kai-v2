'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';

export interface SecuritySettingsState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    mfaRequired: boolean;
    sessionTimeoutMinutes: number;
    ipAllowlistEnabled: boolean;
    ipAllowlist: string[];
}

export const initialSecuritySettingsState: SecuritySettingsState = {
    status: 'idle',
    mfaRequired: false,
    sessionTimeoutMinutes: 480,
    ipAllowlistEnabled: false,
    ipAllowlist: [],
};

export function SecuritySettingsForm({
    action,
    defaultSettings,
}: {
    action: (state: SecuritySettingsState, formData: FormData) => Promise<SecuritySettingsState>;
    defaultSettings: Omit<SecuritySettingsState, 'status' | 'message'>;
}) {
    const [state, formAction] = useActionState(action, {
        ...initialSecuritySettingsState,
        ...defaultSettings,
    });

    return (
        <form action={formAction} className="space-y-4 rounded-2xl bg-[hsl(var(--card)/0.12)] p-6 backdrop-blur">
            <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Security defaults</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Define baseline security requirements for the organization.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Require MFA</span>
                    <input
                        type="checkbox"
                        name="security-mfa-required"
                        key={state.mfaRequired ? 'enabled' : 'disabled'}
                        defaultChecked={state.mfaRequired}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">IP allowlist</span>
                    <input
                        type="checkbox"
                        name="security-ip-allowlist"
                        key={state.ipAllowlistEnabled ? 'enabled' : 'disabled'}
                        defaultChecked={state.ipAllowlistEnabled}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    />
                </label>
                <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Session timeout</span>
                    <select
                        name="security-session-timeout"
                        defaultValue={String(state.sessionTimeoutMinutes)}
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    >
                        <option value="120">2 hours</option>
                        <option value="240">4 hours</option>
                        <option value="480">8 hours</option>
                        <option value="720">12 hours</option>
                        <option value="1440">24 hours</option>
                    </select>
                </label>
            </div>
            <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">IP allowlist entries</span>
                <textarea
                    name="security-ip-allowlist-entries"
                    rows={4}
                    defaultValue={state.ipAllowlist.join('\n')}
                    placeholder="192.0.2.10&#10;198.51.100.0"
                    className="w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Add one IP per line before enabling the allowlist.
                </span>
            </label>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                <span>{state.status === 'success' ? state.message ?? 'Saved' : 'Changes apply immediately'}</span>
            </div>
            <Button type="submit" size="sm" className="px-4">
                Save
            </Button>
            {state.status === 'error' ? (
                <p className="text-xs text-red-500" role="alert">
                    {state.message ?? 'Unable to save'}
                </p>
            ) : null}
        </form>
    );
}
