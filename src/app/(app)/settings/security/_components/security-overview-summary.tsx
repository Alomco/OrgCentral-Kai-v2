import { Bell, MonitorSmartphone, ShieldCheck, ShieldX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityOverviewResponse } from '@/lib/schemas/security-overview';

interface SecurityOverviewSummaryProps {
    sessions: SecurityOverviewResponse['sessions'];
    preferences: SecurityOverviewResponse['notificationPreferences'];
    isMfaEnabled: boolean;
}

export function SecurityOverviewSummary({ sessions, preferences, isMfaEnabled }: SecurityOverviewSummaryProps) {
    const activeSessions = sessions.length;
    const enabledChannels = preferences.filter((preference) => preference.enabled).length;
    const hasNotifications = preferences.length > 0;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Security snapshot
                </CardTitle>
                <CardDescription>At-a-glance status for your account protections.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
                    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        {isMfaEnabled ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                        ) : (
                            <ShieldX className="h-4 w-4 text-amber-500" aria-hidden="true" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">MFA status</p>
                        <div className="flex items-center gap-2">
                            <Badge variant={isMfaEnabled ? 'secondary' : 'outline'}>
                                {isMfaEnabled ? 'Enabled' : 'Not enabled'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Protects sign-ins</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
                    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <MonitorSmartphone className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">Active sessions</p>
                        <p className="text-sm text-foreground" aria-label={`${String(activeSessions)} active sessions`}>
                            {String(activeSessions)} device{activeSessions === 1 ? '' : 's'} signed in
                        </p>
                        <p className="text-xs text-muted-foreground">Review and sign out as needed</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
                    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">Notifications</p>
                        <p className="text-sm text-foreground">
                            {hasNotifications
                                ? `${String(enabledChannels)} channel${enabledChannels === 1 ? '' : 's'} enabled`
                                : 'Preferences not configured'}
                        </p>
                        <p className="text-xs text-muted-foreground">Immediate and summary alerts</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
