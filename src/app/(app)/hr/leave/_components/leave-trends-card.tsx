import { BarChart3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLeaveRequestsForUi } from '@/server/use-cases/hr/leave/get-leave-requests.cached';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function LeaveTrendsCard({
    authorization,
    employeeId,
}: {
    authorization: RepositoryAuthorizationContext;
    employeeId: string;
}) {
    const { requests } = await getLeaveRequestsForUi({ authorization, employeeId });
    const year = new Date().getFullYear();
    const monthlyCounts = Array.from({ length: 12 }, () => 0);

    for (const request of requests) {
        const startDate = new Date(request.startDate);
        if (Number.isNaN(startDate.getTime()) || startDate.getFullYear() !== year) {
            continue;
        }
        monthlyCounts[startDate.getMonth()] += 1;
    }

    const maxCount = Math.max(...monthlyCounts, 1);
    const pendingCount = requests.filter((request) => request.status === 'submitted').length;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Leave Trends
                    </CardTitle>
                    <CardDescription>Monthly leave activity for {year}.</CardDescription>
                </div>
                <Badge variant="secondary" className="shrink-0">{requests.length} total</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    {monthlyCounts.map((count, index) => {
                        const widthPercent = Math.round((count / maxCount) * 100);
                        return (
                            <div key={MONTH_LABELS[index]} className="flex items-center gap-3 text-sm">
                                <span className="w-10 text-xs text-muted-foreground">{MONTH_LABELS[index]}</span>
                                <div className="flex-1 rounded-full bg-muted/40">
                                    <div
                                        className="h-2 rounded-full bg-primary/70"
                                        style={{ width: `${String(widthPercent)}%` }}
                                    />
                                </div>
                                <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{pendingCount} pending</Badge>
                    <span>Use this view to spot busy periods and plan coverage.</span>
                </div>
            </CardContent>
        </Card>
    );
}
