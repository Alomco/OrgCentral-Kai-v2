import { Users, UserCheck, Clock, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoButton, type InfoSection } from '@/components/ui/info-button';
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
    info: InfoSection[];
}

function StatCard({ title, value, icon, description, variant = 'default', info }: StatCardProps) {
    const variantStyles = {
        default: 'text-muted-foreground',
        warning: 'text-amber-500',
        success: 'text-emerald-500',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    {title}
                    <InfoButton label={title} sections={info} />
                </CardTitle>
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
                info={[
                    { label: 'What', text: 'Total employees in this organization.' },
                    { label: 'Prereqs', text: 'Employees provisioned and active.' },
                    { label: 'Next', text: 'Review inactive accounts.' },
                    { label: 'Compliance', text: 'Counts follow org access rules.' },
                ]}
            />
            <StatCard
                title="Active"
                value={stats.activeEmployees}
                icon={<UserCheck className="h-4 w-4" />}
                description="Currently employed"
                variant="success"
                info={[
                    { label: 'What', text: 'Employees with active employment status.' },
                    { label: 'Prereqs', text: 'Status kept up to date.' },
                    { label: 'Next', text: 'Investigate headcount discrepancies.' },
                    { label: 'Compliance', text: 'Status changes are audited.' },
                ]}
            />
            <StatCard
                title="Pending Leave"
                value={stats.pendingLeaveRequests}
                icon={<Clock className="h-4 w-4" />}
                description="Awaiting approval"
                info={[
                    { label: 'What', text: 'Leave requests waiting for approval.' },
                    { label: 'Prereqs', text: 'Leave workflows enabled.' },
                    { label: 'Next', text: 'Review and approve or deny.' },
                    { label: 'Compliance', text: 'Approvals are logged.' },
                ]}
            />
            <StatCard
                title="Compliance Alerts"
                value={stats.complianceAlerts}
                icon={<AlertTriangle className="h-4 w-4" />}
                description="Overdue items"
                variant={stats.complianceAlerts > 0 ? 'warning' : 'default'}
                info={[
                    { label: 'What', text: 'Overdue compliance tasks or evidence gaps.' },
                    { label: 'Prereqs', text: 'Compliance controls configured.' },
                    { label: 'Next', text: 'Open compliance to remediate.' },
                    { label: 'Compliance', text: 'Alerts are recorded for audit.' },
                ]}
            />
            <StatCard
                title="Expiring Soon"
                value={stats.upcomingExpirations}
                icon={<Calendar className="h-4 w-4" />}
                description="Next 30 days"
                info={[
                    { label: 'What', text: 'Items expiring in the next 30 days.' },
                    { label: 'Prereqs', text: 'Expiration tracking enabled.' },
                    { label: 'Next', text: 'Renew or complete before deadlines.' },
                    { label: 'Compliance', text: 'Expirations can impact audit readiness.' },
                ]}
            />
            <StatCard
                title="New Hires"
                value={stats.newHiresThisMonth}
                icon={<TrendingUp className="h-4 w-4" />}
                description="This month"
                variant="success"
                info={[
                    { label: 'What', text: 'Employees onboarded this month.' },
                    { label: 'Prereqs', text: 'Onboarding workflows active.' },
                    { label: 'Next', text: 'Check onboarding completion.' },
                    { label: 'Compliance', text: 'Onboarding steps are logged.' },
                ]}
            />
        </div>
    );
}
