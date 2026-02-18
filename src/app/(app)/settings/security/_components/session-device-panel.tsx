'use client';

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Laptop, ShieldAlert, MonitorDot } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SecuritySessionSummary } from '@/lib/schemas/security-overview';
import { revokeOtherSessionsAction, revokeSessionAction } from '../actions';
import { SECURITY_OVERVIEW_QUERY_KEY } from '../security-query';

interface SessionDevicePanelProps {
    sessions: SecuritySessionSummary[];
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function maskIp(ip: string | null): string {
    if (!ip) {
        return 'Unavailable';
    }

    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.x.x`;
        }
    }

    if (ip.includes(':')) {
        const segments = ip.split(':');
        return `${segments.slice(0, 3).join(':')}::`; // IPv6 truncation
    }

    return 'Unavailable';
}

function resolveDeviceLabel(userAgent: string | null): string {
    if (!userAgent) {
        return 'Unknown device';
    }
    if (userAgent.includes('Windows')) {
        return 'Windows device';
    }
    if (userAgent.includes('Mac OS')) {
        return 'Mac device';
    }
    if (userAgent.includes('Linux')) {
        return 'Linux device';
    }
    if (userAgent.includes('Android')) {
        return 'Android device';
    }
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        return 'iOS device';
    }
    return 'Device';
}

export function SessionDevicePanel({ sessions }: SessionDevicePanelProps) {
    const queryClient = useQueryClient();

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => {
            if (a.isCurrent === b.isCurrent) {
                return new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime();
            }
            return a.isCurrent ? -1 : 1;
        });
    }, [sessions]);

    const revokeSessionMutation = useMutation({
        mutationFn: revokeSessionAction,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SECURITY_OVERVIEW_QUERY_KEY });
        },
    });

    const revokeOtherSessionsMutation = useMutation({
        mutationFn: async () => revokeOtherSessionsAction(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SECURITY_OVERVIEW_QUERY_KEY });
        },
    });

    const isPending = revokeSessionMutation.isPending || revokeOtherSessionsMutation.isPending;

    const handleRevoke = (sessionId: string) => {
        revokeSessionMutation.mutate(
            { sessionId },
            {
                onSuccess: (result) => {
                    if (result.success) {
                        toast.success('Session revoked.');
                    } else {
                        toast.error(result.error.message);
                    }
                },
            },
        );
    };

    const handleRevokeOthers = () => {
        revokeOtherSessionsMutation.mutate(undefined, {
            onSuccess: (result) => {
                if (result.success) {
                    toast.success(`Signed out ${String(result.data.revokedCount)} session(s).`);
                } else {
                    toast.error(result.error.message);
                }
            },
        });
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                                <MonitorDot className="h-4 w-4" aria-hidden="true" />
                            </span>
                            Session & device management
                        </CardTitle>
                        <CardDescription>
                            Review recent sessions and sign out devices you no longer use.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRevokeOthers} disabled={isPending}>
                        Sign out other devices
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedSessions.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                        No active sessions found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedSessions.map((session) => (
                            <div
                                key={session.sessionId}
                                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                        <Laptop className="h-4 w-4" aria-hidden="true" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold">{resolveDeviceLabel(session.userAgent)}</p>
                                            {session.isCurrent ? (
                                                <Badge variant="secondary">Current</Badge>
                                            ) : (
                                                <Badge variant="outline">Active</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Last active {formatDate(session.lastAccess)} · IP {maskIp(session.ipAddress)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Started {formatDate(session.startedAt)} · Expires {formatDate(session.expiresAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {session.isCurrent ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <ShieldAlert className="h-4 w-4" />
                                            Protected session
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRevoke(session.sessionId)}
                                            disabled={isPending}
                                        >
                                            Sign out
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
