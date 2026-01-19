import { Users, UserCheck, UserMinus, UserPlus, type LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getEmployeeDirectoryStats } from '@/server/use-cases/hr/people/get-employee-directory-stats';
import { hasPermission } from '@/lib/security/permission-check';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

interface PeopleStatsProps {
    authorization: RepositoryAuthorizationContext;
}

export async function PeopleStats({ authorization }: PeopleStatsProps) {
    const isAdmin = hasPermission(authorization.permissions, 'organization', 'update');

    if (!isAdmin) {
        return null;
    }

    const stats = await getEmployeeDirectoryStats({
        employeeProfileRepository: new (await import('@/server/repositories/prisma/hr/people/prisma-employee-profile-repository')).PrismaEmployeeProfileRepository(),
    }, {
        authorization,
    });

    const safeTotal = stats.total > 0 ? stats.total : 1;
    const activePercent = ((stats.active / safeTotal) * 100).toFixed(1);
    const onLeavePercent = ((stats.onLeave / safeTotal) * 100).toFixed(1);
    const activeFlexClass = `flex-[${Math.max(stats.active, 0).toString()}]`;
    const onLeaveFlexClass = `flex-[${Math.max(stats.onLeave, 0).toString()}]`;

    return (
        <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Workforce Overview</CardTitle>
                <CardDescription>Current employee distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <StatRow label="Total Employees" value={stats.total} icon={Users} color="text-primary" />
                    <StatRow label="Active" value={stats.active} icon={UserCheck} color="text-accent" />
                    <StatRow label="On Leave" value={stats.onLeave} icon={UserMinus} color="text-secondary" />
                    <StatRow label="New this Month" value={stats.newThisMonth} icon={UserPlus} color="text-primary" />

                    {/* Simple Bar Visualization */}
                    <div className="pt-4 space-y-2">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
                            <div className={cn('basis-0 bg-accent transition-all', activeFlexClass)} />
                            <div className={cn('basis-0 bg-secondary transition-all', onLeaveFlexClass)} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-accent" />
                                <span>Active</span>
                                <span className="text-[11px] text-muted-foreground">{activePercent}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-secondary" />
                                <span>On Leave</span>
                                <span className="text-[11px] text-muted-foreground">{onLeavePercent}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatRow({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <span className="font-bold">{value}</span>
        </div>
    );
}

export function PeopleStatsSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded-md" />
                    <div className="h-4 w-48 bg-muted rounded-md" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex justify-between">
                            <div className="h-4 w-24 bg-muted rounded-md" />
                            <div className="h-4 w-8 bg-muted rounded-md" />
                        </div>
                    ))}
                    <div className="h-2 w-full bg-muted rounded-full mt-4" />
                </div>
            </CardContent>
        </Card>
    );
}
