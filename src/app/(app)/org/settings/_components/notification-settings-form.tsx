'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { InfoButton } from '@/components/ui/info-button';

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
        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">Notification defaults</p>
                    <p className="text-xs text-muted-foreground">
                        Control admin digests and critical alerts for your organization.
                    </p>
                </div>
                <InfoButton
                    label="Notification defaults"
                    sections={[
                        { label: 'What', text: 'Set org-wide admin notification preferences.' },
                        { label: 'Prereqs', text: 'Applies to new admins by default.' },
                        { label: 'Next', text: 'Admins can still adjust personal settings.' },
                        { label: 'Compliance', text: 'Keep alert coverage for audit readiness.' },
                    ]}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Admin digest</span>
                    <select
                        name="notifications-admin-digest"
                        defaultValue={state.adminDigest}
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <option value="off">Off</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Security alerts</span>
                    <input
                        type="checkbox"
                        name="notifications-security-alerts"
                        key={state.securityAlerts ? 'enabled' : 'disabled'}
                        defaultChecked={state.securityAlerts}
                        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Product updates</span>
                    <input
                        type="checkbox"
                        name="notifications-product-updates"
                        key={state.productUpdates ? 'enabled' : 'disabled'}
                        defaultChecked={state.productUpdates}
                        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    />
                </label>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                <span>{state.status === 'success' ? state.message ?? 'Saved' : 'Changes apply immediately'}</span>
            </div>
            <Button type="submit" size="sm" className="px-4">
                Save
            </Button>
            {state.status === 'error' ? (
                <p className="text-xs text-destructive" role="alert">
                    {state.message ?? 'Unable to save'}
                </p>
            ) : null}
        </form>
    );
}
