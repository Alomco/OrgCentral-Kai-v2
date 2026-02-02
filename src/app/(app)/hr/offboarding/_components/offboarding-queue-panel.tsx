import { unstable_noStore as noStore } from 'next/cache';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { OFFBOARDING_STATUS_VALUES } from '@/server/types/hr/offboarding-types';
import { PrismaOffboardingRepository } from '@/server/repositories/prisma/hr/offboarding';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding';
import { listOffboardingQueue } from '@/server/use-cases/hr/offboarding';
import { formatEmployeeName } from '../../employees/_components/employee-formatters';
import { OffboardingQueueStatsRow } from './offboarding-queue-stats';
import { OffboardingQueueTable } from './offboarding-queue-table';
import {
    buildQueueStats,
    formatStatus,
    parseStatusFilter,
    type OffboardingQueueRow,
} from './offboarding-queue-utils';

interface OffboardingQueuePanelProps {
    authorization: RepositoryAuthorizationContext;
    searchParams: Record<string, string | string[] | undefined>;
}

export async function OffboardingQueuePanel({ authorization, searchParams }: OffboardingQueuePanelProps) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
    }

    const statusFilter = parseStatusFilter(searchParams.status);
    const filters = statusFilter ? { status: statusFilter } : undefined;

    const offboardingRepository = new PrismaOffboardingRepository();
    const employeeProfileRepository = new PrismaEmployeeProfileRepository();
    const checklistInstanceRepository = new PrismaChecklistInstanceRepository();

    const [allRecords, filteredRecords] = await Promise.all([
        listOffboardingQueue({ offboardingRepository }, { authorization }),
        listOffboardingQueue({ offboardingRepository }, { authorization, filters }),
    ]);

    const rows = await Promise.all(
        filteredRecords.records.map(async (record): Promise<OffboardingQueueRow> => {
            const profile = await employeeProfileRepository.getEmployeeProfile(
                authorization.orgId,
                record.employeeId,
            );

            const instance = record.checklistInstanceId
                ? await checklistInstanceRepository.getInstance(
                    authorization.orgId,
                    record.checklistInstanceId,
                )
                : null;

            const totalItems = instance?.items.length ?? 0;
            const completedItems = instance?.items.filter((item) => item.completed).length ?? 0;
            const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return {
                id: record.id,
                employeeId: record.employeeId,
                employeeName: profile ? formatEmployeeName(profile) : 'Unknown employee',
                employeeNumber: profile?.employeeNumber ?? null,
                status: record.status,
                startedAt: record.startedAt,
                completedAt: record.completedAt ?? null,
                checklistProgress: instance
                    ? { completed: completedItems, total: totalItems, percent }
                    : null,
            };
        }),
    );

    const stats = buildQueueStats(allRecords.records);

    return (
        <div className="space-y-6">
            <OffboardingQueueStatsRow stats={stats} />

            <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Queue details</CardTitle>
                        <CardDescription>Track checklist progress and take action.</CardDescription>
                    </div>
                    <form method="get" className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <select
                                name="status"
                                defaultValue={statusFilter ?? ''}
                                className="bg-transparent text-sm outline-none"
                                aria-label="Filter offboarding status"
                            >
                                <option value="">All statuses</option>
                                {OFFBOARDING_STATUS_VALUES.map((value) => (
                                    <option key={value} value={value}>
                                        {formatStatus(value)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" size="sm" variant="outline">
                            Apply
                        </Button>
                    </form>
                </CardHeader>
                <CardContent className="overflow-auto">
                    <OffboardingQueueTable rows={rows} />
                </CardContent>
            </Card>
        </div>
    );
}
