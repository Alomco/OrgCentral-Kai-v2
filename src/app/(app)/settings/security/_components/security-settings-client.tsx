'use client';

import { Activity, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MfaPanel } from './mfa-panel';
import { PasswordManagementPanel } from './password-management-panel';
import { SessionDevicePanel } from './session-device-panel';
import { RecoveryOptionsPanel } from './recovery-options-panel';
import { SecurityNotificationsPanel } from './security-notifications-panel';
import { SecurityOverviewSummary } from './security-overview-summary';
import { SECURITY_OVERVIEW_QUERY_KEY, fetchSecurityOverview } from '../security-query';
import type { SecurityOverviewResponse } from '@/lib/schemas/security-overview';

interface SecuritySettingsClientProps {
    initialData: SecurityOverviewResponse;
    isMfaEnabled: boolean;
}

export function SecuritySettingsClient({ initialData, isMfaEnabled }: SecuritySettingsClientProps) {
    const { data, isError } = useQuery({
        queryKey: SECURITY_OVERVIEW_QUERY_KEY,
        queryFn: fetchSecurityOverview,
        initialData,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });
    const [activeTab, setActiveTab] = useState<'overview' | 'notifications'>('overview');

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Unable to load security settings</AlertTitle>
                <AlertDescription>
                    We couldn’t load your security overview. Please refresh the page.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-5">
            <div
                role="tablist"
                aria-label="Security settings sections"
                className="flex w-full flex-wrap items-center gap-1.5 rounded-full border border-border/60 bg-card/60 p-1"
            >
                <button
                    type="button"
                    role="tab"
                    id="security-overview-tab"
                    aria-controls="security-overview-panel"
                    aria-selected={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    className={
                        activeTab === 'overview'
                            ? 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm'
                            : 'rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground'
                    }
                >
                    Account protection
                </button>
                <button
                    type="button"
                    role="tab"
                    id="security-notifications-tab"
                    aria-controls="security-notifications-panel"
                    aria-selected={activeTab === 'notifications'}
                    onClick={() => setActiveTab('notifications')}
                    className={
                        activeTab === 'notifications'
                            ? 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm'
                            : 'rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground'
                    }
                >
                    Notifications
                </button>
            </div>

            <Activity mode={activeTab === 'overview' ? 'visible' : 'hidden'}>
                <section
                    id="security-overview-panel"
                    role="tabpanel"
                    aria-labelledby="security-overview-tab"
                    className="space-y-6"
                >
                    <h2 className="sr-only">Account protection</h2>
                    <div className="space-y-5">
                        <div className="grid gap-4 xl:grid-cols-2">
                            <SecurityOverviewSummary
                                sessions={data.sessions}
                                preferences={data.notificationPreferences}
                                isMfaEnabled={isMfaEnabled}
                            />
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Security checklist</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-foreground">Enable MFA</p>
                                            <p className="text-xs">Add a second factor to prevent unauthorized access.</p>
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {isMfaEnabled ? 'Done' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-foreground">Review devices</p>
                                            <p className="text-xs">Sign out sessions you don’t recognize.</p>
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">Weekly</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-foreground">Keep recovery codes</p>
                                            <p className="text-xs">Store backups in a secure password manager.</p>
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">Essential</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <section className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4 md:p-6">
                            <div className="space-y-1.5">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sign-in</p>
                                <h3 className="text-lg font-semibold text-foreground">Identity & sign-in</h3>
                                <p className="text-sm text-muted-foreground">
                                    Keep access secure with strong authentication and password recovery options.
                                </p>
                            </div>
                            <div className="grid items-start gap-4 xl:grid-cols-2">
                                <MfaPanel isMfaEnabled={isMfaEnabled} />
                                <PasswordManagementPanel />
                            </div>
                        </section>

                        <section className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4 md:p-6">
                            <div className="space-y-1.5">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessions</p>
                                <h3 className="text-lg font-semibold text-foreground">Devices & recovery</h3>
                                <p className="text-sm text-muted-foreground">
                                    Review active devices and keep recovery options handy.
                                </p>
                            </div>
                            <div className="grid items-start gap-4 xl:grid-cols-2">
                                <SessionDevicePanel sessions={data.sessions} />
                                <RecoveryOptionsPanel />
                            </div>
                        </section>
                    </div>
                </section>
            </Activity>

            <Activity mode={activeTab === 'notifications' ? 'visible' : 'hidden'}>
                <section
                    id="security-notifications-panel"
                    role="tabpanel"
                    aria-labelledby="security-notifications-tab"
                    className="space-y-6"
                >
                    <h2 className="sr-only">Security notifications</h2>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <SecurityNotificationsPanel preferences={data.notificationPreferences} />
                        <aside className="space-y-6 lg:sticky lg:top-6">
                            <SecurityOverviewSummary
                                sessions={data.sessions}
                                preferences={data.notificationPreferences}
                                isMfaEnabled={isMfaEnabled}
                            />
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle>Notification tips</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    <p>
                                        Keep immediate alerts on for suspicious sign-ins and critical account changes.
                                    </p>
                                    <p>Summary alerts are great for weekly reviews without inbox overload.</p>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </section>
            </Activity>
        </div>
    );
}
