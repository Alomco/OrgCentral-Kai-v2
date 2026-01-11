import { AlertTriangle, Clock, FileWarning, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminDashboardStats } from '../actions.types';

interface HrAdminAlertsProps {
    stats: AdminDashboardStats;
}

interface AlertItemProps {
    icon: React.ReactNode;
    title: string;
    count: number;
    href: string;
    variant: 'warning' | 'destructive' | 'default';
}

function AlertItem({ icon, title, count, href, variant }: AlertItemProps) {
    if (count === 0) {return null;}

    const variantStyles = {
        warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50',
        destructive: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50',
        default: 'border-border bg-muted/50',
    };

    return (
        <Link
            href={href}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted ${variantStyles[variant]}`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium text-sm">{title}</span>
            </div>
            <Badge variant={variant === 'destructive' ? 'destructive' : 'secondary'}>
                {count}
            </Badge>
        </Link>
    );
}

/**
 * Admin alerts panel - shows compliance and pending action alerts
 */
export function HrAdminAlerts({ stats }: HrAdminAlertsProps) {
    const hasAlerts = stats.complianceAlerts > 0 || stats.upcomingExpirations > 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Alerts & Actions
                    </CardTitle>
                    <CardDescription>Items requiring attention</CardDescription>
                </div>
                {hasAlerts ? (
                    <Badge variant="destructive" className="animate-pulse">
                        {stats.complianceAlerts + stats.upcomingExpirations}
                    </Badge>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
                {hasAlerts ? (
                    <>
                        <AlertItem
                            icon={<FileWarning className="h-4 w-4 text-red-500" />}
                            title="Overdue Compliance Items"
                            count={stats.complianceAlerts}
                            href="/hr/compliance"
                            variant="destructive"
                        />
                        <AlertItem
                            icon={<Clock className="h-4 w-4 text-amber-500" />}
                            title="Expiring Soon"
                            count={stats.upcomingExpirations}
                            href="/hr/compliance"
                            variant="warning"
                        />
                        <AlertItem
                            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                            title="Pending Leave Requests"
                            count={stats.pendingLeaveRequests}
                            href="/hr/leave"
                            variant="default"
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-sm font-medium">All Clear!</p>
                        <p className="text-xs text-muted-foreground">
                            No pending alerts at this time
                        </p>
                    </div>
                )}
                <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/hr/compliance">View All Compliance Items</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
