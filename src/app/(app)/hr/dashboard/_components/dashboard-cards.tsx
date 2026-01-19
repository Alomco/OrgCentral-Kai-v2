import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    FileText,
    Settings,
    User,
    Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { listHrPoliciesForUi } from '@/server/use-cases/hr/policies/list-hr-policies.cached';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { formatHumanDate } from '../../_components/format-date';

export type DashboardAuthorization = Parameters<typeof listHrPoliciesForUi>[0]['authorization'];

interface DashboardAction {
    href: string;
    label: string;
    icon: LucideIcon;
    description: string;
}

// Quick actions for employees
export const EMPLOYEE_ACTIONS: DashboardAction[] = [
    { href: '/hr/leave', label: 'Request Leave', icon: Calendar, description: 'Submit a leave request' },
    { href: '/hr/profile', label: 'My Profile', icon: User, description: 'View and update your details' },
    { href: '/hr/policies', label: 'View Policies', icon: FileText, description: 'Read company policies' },
    { href: '/hr/absence', label: 'Report Absence', icon: AlertCircle, description: 'Log unplanned absence' },
];

// Admin-only actions
export const ADMIN_ACTIONS: DashboardAction[] = [
    { href: '/hr/employees', label: 'Employees', icon: Users, description: 'Manage employee records' },
    { href: '/hr/settings', label: 'Settings', icon: Settings, description: 'Configure HR settings' },
];

export async function WelcomeCard({
    authorization,
    profile,
}: {
    authorization: DashboardAuthorization;
    profile?: EmployeeProfile | null;
}) {
    let displayName = 'there';
    let jobTitle = 'Employee';
    let resolvedProfile = profile;

    if (resolvedProfile === undefined) {
        try {
            const peopleService = getPeopleService();
            const result = await peopleService.getEmployeeProfileByUser({
                authorization,
                payload: { userId: authorization.userId },
            });

            resolvedProfile = result.profile;
        } catch {
            // Gracefully handle ABAC or other permission errors
        }
    }

    if (resolvedProfile) {
        displayName = resolvedProfile.displayName ?? resolvedProfile.firstName ?? 'there';
        jobTitle = resolvedProfile.jobTitle ?? 'Employee';
    }

    return (
        <Card className="border border-border/60 bg-card">
            <CardHeader>
                <CardDescription>Welcome back</CardDescription>
                <CardTitle className="text-2xl">Hello, {displayName}!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {jobTitle} Use this dashboard to manage your HR tasks.
                </p>
            </CardContent>
        </Card>
    );
}

export function WelcomeSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-64" />
            </CardContent>
        </Card>
    );
}

export async function PoliciesSummaryCard({ authorization }: { authorization: DashboardAuthorization }) {
    const { policies } = await listHrPoliciesForUi({ authorization });
    const sorted = policies
        .slice()
        .sort((left, right) => right.effectiveDate.getTime() - left.effectiveDate.getTime());

    const recent = sorted.slice(0, 3).map((policy) => ({
        id: policy.id,
        title: policy.title,
        effectiveDate: policy.effectiveDate,
    }));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base">Policies</CardTitle>
                    <CardDescription>Company policies to review</CardDescription>
                </div>
                <Badge variant="secondary">{policies.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
                {recent.length > 0 ? (
                    <>
                        {recent.map((policy) => (
                            <Link
                                key={policy.id}
                                href={`/hr/policies/${policy.id}`}
                                className={
                                    'flex items-center justify-between rounded-lg border border-border/50 bg-background/20 px-3 py-2 text-sm transition-colors ' +
                                    'hover:bg-muted/40 hover:border-border ' +
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                                }
                            >
                                <span className="font-medium truncate">{policy.title}</span>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                    {formatHumanDate(policy.effectiveDate)}
                                </span>
                            </Link>
                        ))}
                        <Link
                            href="/hr/policies"
                            className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
                        >
                            View all policies
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No policies published yet.</p>
                )}
            </CardContent>
        </Card>
    );
}

export function PoliciesSummarySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
}

export function QuickActionsCard({
    actions,
    title,
    description,
}: {
    actions: DashboardAction[];
    title: string;
    description: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                    {actions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className={
                                'group flex items-start gap-3 rounded-lg border border-border/50 bg-background/20 p-3 transition-colors ' +
                                'hover:bg-muted/40 hover:border-border ' +
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                            }
                        >
                            <action.icon className="h-5 w-5 shrink-0 text-primary/80 transition-colors group-hover:text-primary" />
                            <div>
                                <div className="font-medium text-sm">{action.label}</div>
                                <div className="text-xs text-muted-foreground">{action.description}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-5 w-56" />
            <WelcomeSkeleton />
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                    </div>
                </CardContent>
            </Card>
            <PoliciesSummarySkeleton />
        </div>
    );
}

