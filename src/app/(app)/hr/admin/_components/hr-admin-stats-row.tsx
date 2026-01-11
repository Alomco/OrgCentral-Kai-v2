import { Users, UserCheck, Clock, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminDashboardStats } from '../actions.types';

interface HrAdminStatsRowProps {
    stats: AdminDashboardStats;
}

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    variant?: 'default' | 'warning' | 'success';
}

function StatCard({ title, value, icon, description, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: 'text-muted-foreground',
        warning: 'text-amber-500',
        success: 'text-emerald-500',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={variantStyles[variant]}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description ? (
                    <p className="text-xs text-muted-foreground">{description}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

/**
 * Admin dashboard stats row - displays key HR metrics
 */
export function HrAdminStatsRow({ stats }: HrAdminStatsRowProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
                title="Total Employees"
                value={stats.totalEmployees}
                icon={<Users className="h-4 w-4" />}
                description="All employees"
            />
            <StatCard
                title="Active"
                value={stats.activeEmployees}
                icon={<UserCheck className="h-4 w-4" />}
                description="Currently employed"
                variant="success"
            />
            <StatCard
                title="Pending Leave"
                value={stats.pendingLeaveRequests}
                icon={<Clock className="h-4 w-4" />}
                description="Awaiting approval"
            />
            <StatCard
                title="Compliance Alerts"
                value={stats.complianceAlerts}
                icon={<AlertTriangle className="h-4 w-4" />}
                description="Overdue items"
                variant={stats.complianceAlerts > 0 ? 'warning' : 'default'}
            />
            <StatCard
                title="Expiring Soon"
                value={stats.upcomingExpirations}
                icon={<Calendar className="h-4 w-4" />}
                description="Next 30 days"
            />
            <StatCard
                title="New Hires"
                value={stats.newHiresThisMonth}
                icon={<TrendingUp className="h-4 w-4" />}
                description="This month"
                variant="success"
            />
        </div>
    );
}
