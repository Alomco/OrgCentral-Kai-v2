import { Activity } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getAbsences } from '@/server/use-cases/hr/absences/get-absences';
import { PrismaUnplannedAbsenceRepository } from '@/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository';

export async function AbsenceTrendsCard({
    authorization,
    absenceTypes,
}: {
    authorization: RepositoryAuthorizationContext;
    absenceTypes: { id: string; label: string }[];
}) {
    const absenceRepository = new PrismaUnplannedAbsenceRepository();
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90);

    const result = await getAbsences(
        { absenceRepository },
        {
            authorization,
            filters: {
                userId: authorization.userId,
                from: ninetyDaysAgo,
            },
        },
    ).catch(() => ({ absences: [] }));

    const typeLabels = new Map(absenceTypes.map((type) => [type.id, type.label]));
    const countsByType = new Map<string, number>();
    const countsByStatus = new Map<string, number>();

    for (const absence of result.absences) {
        const label = typeLabels.get(absence.typeId) ?? absence.typeId;
        countsByType.set(label, (countsByType.get(label) ?? 0) + 1);
        countsByStatus.set(absence.status, (countsByStatus.get(absence.status) ?? 0) + 1);
    }

    const topTypes = Array.from(countsByType.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Absence Trends
                </CardTitle>
                <CardDescription>Last 90 days of absence activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {result.absences.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No absences recorded in the last 90 days.</p>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(countsByStatus.entries()).map(([status, count]) => (
                                <Badge key={status} variant="outline">
                                    {status.toLowerCase()} {count}
                                </Badge>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Top absence types
                            </p>
                            {topTypes.map(([label, count]) => (
                                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate">{label}</span>
                                    <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
