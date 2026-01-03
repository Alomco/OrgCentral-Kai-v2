'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';

export interface NotificationSettingsState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    adminDigest: 'off' | 'daily' | 'weekly';
    securityAlerts: boolean;
    productUpdates: boolean;
}

export const initialNotificationSettingsState: NotificationSettingsState = {
    status: 'idle',
    adminDigest: 'weekly',
    securityAlerts: true,
    productUpdates: true,
};

export function NotificationSettingsForm({
    action,
    defaultSettings,
}: {
    action: (state: NotificationSettingsState, formData: FormData) => Promise<NotificationSettingsState>;
    defaultSettings: Omit<NotificationSettingsState, 'status' | 'message'>;
}) {
    const [state, formAction] = useActionState(action, {
        ...initialNotificationSettingsState,
        ...defaultSettings,
    });

    return (
        <form action={formAction} className="space-y-4 rounded-2xl bg-[hsl(var(--card)/0.12)] p-6 backdrop-blur">
            <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Notification defaults</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Control admin digests and critical alerts for your organization.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Admin digest</span>
                    <select
                        name="notifications-admin-digest"
                        defaultValue={state.adminDigest}
                        className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    >
                        <option value="off">Off</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Security alerts</span>
                    <input
                        type="checkbox"
                        name="notifications-security-alerts"
                        key={state.securityAlerts ? 'enabled' : 'disabled'}
                        defaultChecked={state.securityAlerts}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">Product updates</span>
                    <input
                        type="checkbox"
                        name="notifications-product-updates"
                        key={state.productUpdates ? 'enabled' : 'disabled'}
                        defaultChecked={state.productUpdates}
                        className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    />
                </label>
            </div>
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
