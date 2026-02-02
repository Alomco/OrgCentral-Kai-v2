import Link from 'next/link';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ExpiringItem {
    id: string;
    title: string;
    employeeName: string;
    employeeId: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    category: string;
}

interface ComplianceExpiryPanelProps {
    expiringItems: ExpiringItem[];
}

function getExpiryStatus(days: number): {
    variant: 'destructive' | 'warning' | 'default';
    label: string;
    icon: typeof AlertTriangle;
} {
    if (days < 0) {
        return { variant: 'destructive', label: 'Expired', icon: AlertTriangle };
    }
    if (days <= 7) {
        return { variant: 'destructive', label: `${String(days)}d`, icon: AlertTriangle };
    }
    if (days <= 30) {
        return { variant: 'warning', label: `${String(days)}d`, icon: Clock };
    }
    return { variant: 'default', label: `${String(days)}d`, icon: CheckCircle };
}

export function ComplianceExpiryPanel({ expiringItems }: ComplianceExpiryPanelProps) {
    const expired = expiringItems.filter((item) => item.daysUntilExpiry < 0);
    const expiringIn7Days = expiringItems.filter(
        (item) => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7,
    );
    const expiringIn30Days = expiringItems.filter(
        (item) => item.daysUntilExpiry > 7 && item.daysUntilExpiry <= 30,
    );

    const totalUrgent = expired.length + expiringIn7Days.length;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expiry Management
                    </CardTitle>
                    <CardDescription>
                        {expiringItems.length} items expiring in the next 30 days
                    </CardDescription>
                </div>
                {totalUrgent > 0 ? (
                    <Badge variant="destructive" className="animate-pulse">
                        {totalUrgent} urgent
                    </Badge>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {expired.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Expired</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {expiringIn7Days.length}
                        </p>
                        <p className="text-xs text-muted-foreground">7 days</p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-2xl font-bold">{expiringIn30Days.length}</p>
                        <p className="text-xs text-muted-foreground">30 days</p>
                    </div>
                </div>

                {/* Item List */}
                {expiringItems.length > 0 ? (
                    <div className="space-y-2">
                        {expiringItems.slice(0, 5).map((item) => {
                            const status = getExpiryStatus(item.daysUntilExpiry);
                            const StatusIcon = status.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={`/hr/compliance/${item.id}?userId=${encodeURIComponent(item.employeeId)}`}
                                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <StatusIcon
                                            className={`h-4 w-4 shrink-0 ${status.variant === 'destructive'
                                                ? 'text-red-500'
                                                : status.variant === 'warning'
                                                    ? 'text-amber-500'
                                                    : 'text-muted-foreground'
                                                }`}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.employeeName} • {item.category}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            status.variant === 'warning' ? 'secondary' : status.variant
                                        }
                                        className="shrink-0"
                                    >
                                        {status.label}
                                    </Badge>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-sm font-medium">No Upcoming Expirations</p>
                        <p className="text-xs text-muted-foreground">
                            All compliance items are up to date
                        </p>
                    </div>
                )}

                {expiringItems.length > 5 ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/hr/compliance?filter=expiring">
                            View all {expiringItems.length} expiring items
                        </Link>
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
