'use client';

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BellRing } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { SecurityOverviewResponse } from '@/lib/schemas/security-overview';
import type { SecurityNotificationType } from '../security-notification-types';
import { extractSecurityNotificationState, type JsonObject } from '../security-notification-helpers';
import { updateSecurityNotificationPreference } from '../actions';
import { SECURITY_OVERVIEW_QUERY_KEY } from '../security-query';
import {
    IMMEDIATE_SECURITY_NOTIFICATIONS,
    SUMMARY_SECURITY_NOTIFICATIONS,
    SECURITY_NOTIFICATION_LABELS,
} from '../security-notification-copy';

interface SecurityNotificationsPanelProps {
    preferences: SecurityOverviewResponse['notificationPreferences'];
}

type SecurityNotificationPreference = SecurityOverviewResponse['notificationPreferences'][number];

function normalizeMetadata(preference: SecurityNotificationPreference): JsonObject {
    const metadata = preference.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return {};
    }
    return metadata as JsonObject;
}


export function SecurityNotificationsPanel({ preferences }: SecurityNotificationsPanelProps) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: updateSecurityNotificationPreference,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SECURITY_OVERVIEW_QUERY_KEY });
        },
    });

    const channelPreferences = useMemo(() => {
        const email = preferences.find((item) => item.channel === 'EMAIL');
        const inApp = preferences.find((item) => item.channel === 'IN_APP');
        return { email, inApp };
    }, [preferences]);

    const handleToggleChannel = (preference: SecurityNotificationPreference | undefined, enabled: boolean) => {
        if (!preference) {
            return;
        }
        mutation.mutate(
            {
                preferenceId: preference.id,
                enabled,
            },
            {
                onSuccess: (result) => {
                    if (result.success) {
                        toast.success('Security notification channel updated.');
                    } else {
                        toast.error(result.error.message);
                    }
                },
            },
        );
    };

    const handleToggleType = (
        preference: SecurityNotificationPreference | undefined,
        type: SecurityNotificationType,
        enabled: boolean,
    ) => {
        if (!preference) {
            return;
        }
        const metadata = normalizeMetadata(preference);
        const { disabledTypes } = extractSecurityNotificationState(metadata);
        const nextDisabled = enabled
            ? disabledTypes.filter((item) => item !== type)
            : Array.from(new Set([...disabledTypes, type]));

        mutation.mutate(
            {
                preferenceId: preference.id,
                disabledTypes: nextDisabled,
            },
            {
                onSuccess: (result) => {
                    if (!result.success) {
                        toast.error(result.error.message);
                        return;
                    }
                    return;
                },
            },
        );
    };

    const renderChannel = (
        label: string,
        channelKey: string,
        preference: SecurityNotificationPreference | undefined,
    ) => {
        const metadata = preference ? normalizeMetadata(preference) : {};
        const { disabledTypes } = extractSecurityNotificationState(metadata);
        const channelEnabled = preference ? preference.enabled : true;
        const channelToggleId = `${channelKey}-toggle`;

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle>{label}</CardTitle>
                            <CardDescription>Choose which security alerts appear here.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={channelToggleId} className="sr-only">
                                Enable {label}
                            </Label>
                            <Switch
                                id={channelToggleId}
                                checked={channelEnabled}
                                onCheckedChange={(checked) => handleToggleChannel(preference, checked)}
                                disabled={mutation.isPending}
                                aria-describedby={`${channelKey}-description`}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p id={`${channelKey}-description`} className="text-xs text-muted-foreground">
                        Immediate alerts are sent sooner when risk is detected. Summary notifications arrive weekly.
                    </p>
                    {channelEnabled ? (
                        <div className="mt-4 space-y-4">
                            <div aria-labelledby={`${channelKey}-immediate`} className="space-y-3">
                                <p id={`${channelKey}-immediate`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Immediate alerts
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {IMMEDIATE_SECURITY_NOTIFICATIONS.map((type) => {
                                        const isEnabled = !disabledTypes.includes(type);
                                        const controlId = `${channelKey}-${type}`;
                                        const meta = SECURITY_NOTIFICATION_LABELS[type];
                                        return (
                                            <div key={controlId} className="flex items-start gap-3">
                                                <Switch
                                                    id={controlId}
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) => handleToggleType(preference, type, checked)}
                                                    disabled={mutation.isPending || !channelEnabled}
                                                />
                                                <Label htmlFor={controlId} className="text-sm font-normal">
                                                    <span className="font-medium text-foreground">{meta.label}</span>
                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {meta.description}
                                                    </span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div aria-labelledby={`${channelKey}-summary`} className="space-y-3">
                                <p id={`${channelKey}-summary`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Other notifications
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {SUMMARY_SECURITY_NOTIFICATIONS.map((type) => {
                                        const isEnabled = !disabledTypes.includes(type);
                                        const controlId = `${channelKey}-${type}`;
                                        const meta = SECURITY_NOTIFICATION_LABELS[type];
                                        return (
                                            <div key={controlId} className="flex items-start gap-3">
                                                <Switch
                                                    id={controlId}
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) => handleToggleType(preference, type, checked)}
                                                    disabled={mutation.isPending || !channelEnabled}
                                                />
                                                <Label htmlFor={controlId} className="text-sm font-normal">
                                                    <span className="font-medium text-foreground">{meta.label}</span>
                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {meta.description}
                                                    </span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                            Enable {label} to configure delivery timing and notification types.
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                        <BellRing className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Security notifications
                </CardTitle>
                <CardDescription>
                    Control how we notify you about security-sensitive activity. Alerts never include secrets.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {preferences.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                        Notification preferences are not available yet.
                    </div>
                ) : (
                    <>
                        {renderChannel('Email alerts', 'email-alerts', channelPreferences.email)}
                        {renderChannel('In-app alerts', 'in-app-alerts', channelPreferences.inApp)}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
