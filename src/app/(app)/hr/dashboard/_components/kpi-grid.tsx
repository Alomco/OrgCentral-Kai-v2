import { Briefcase, Calendar, Users, Clock, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getLeaveBalance } from '@/server/use-cases/hr/leave/get-leave-balance';
import { getLeaveRequests } from '@/server/use-cases/hr/leave/get-leave-requests';
import { getAbsences } from '@/server/use-cases/hr/absences/get-absences';
import { countEmployeeProfiles } from '@/server/use-cases/hr/people/count-employee-profiles';
import { listComplianceItems } from '@/server/use-cases/hr/compliance/list-compliance-items';
import { listDocumentsService } from '@/server/services/records/document-vault-service';
import { hasPermission } from '@/lib/security/permission-check';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

interface KpiGridProps {
    authorization: RepositoryAuthorizationContext;
    employeeId?: string | null;
}

export async function KpiGrid({ authorization, employeeId }: KpiGridProps) {
    const isAdmin = hasPermission(authorization.permissions, 'organization', 'update');

    // Parallel data fetching
    const [
        balanceResult,
        pendingResult,
        absencesResult,
        employeeCountResult,
        complianceItems,
        documents,
    ] = await Promise.all([
        // 1. Leave Balance
        employeeId
            ? getLeaveBalance({
                leaveBalanceRepository: new (await import('@/server/repositories/prisma/hr/leave/prisma-leave-balance-repository')).PrismaLeaveBalanceRepository(),
            }, {
                authorization,
                employeeId,
                year: new Date().getFullYear(),
            }).catch(() => null)
            : Promise.resolve(null),

        // 2. Pending Requests
        employeeId
            ? getLeaveRequests({
                leaveRequestRepository: new (await import('@/server/repositories/prisma/hr/leave/prisma-leave-request-repository')).PrismaLeaveRequestRepository(),
            }, {
                authorization,
                employeeId,
                filters: { status: 'submitted' },
            }).catch(() => null)
            : Promise.resolve(null),

        // 3. Team Status (Absent today)
        getAbsences({
            absenceRepository: new (await import('@/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository')).PrismaUnplannedAbsenceRepository(),
        }, {
            authorization,
            filters: {
                from: new Date(),
                to: new Date(),
            },
        }).catch(() => null),

        // 4. Total Employees (Admin only)
        isAdmin ? countEmployeeProfiles({
            employeeProfileRepository: new (await import('@/server/repositories/prisma/hr/people/prisma-employee-profile-repository')).PrismaEmployeeProfileRepository(),
        }, {
            authorization,
        }).catch(() => null) : Promise.resolve(null),
        // 5. Compliance items (employee scope)
        listComplianceItems({
            complianceItemRepository: new (await import('@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository')).PrismaComplianceItemRepository(),
        }, {
            authorization,
            userId: authorization.userId,
        }).catch(() => []),
        listDocumentsService(authorization, { ownerUserId: authorization.userId }).catch(() => []),
    ]);

    const leaveBalance = balanceResult?.balances.reduce((accumulator, current) => accumulator + current.available, 0) ?? 0;
    const pendingRequests = pendingResult?.requests.length ?? 0;
    const absentToday = absencesResult?.absences.length ?? 0;
    const totalEmployees = employeeCountResult?.count ?? 0;
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const complianceDueSoon = complianceItems.filter((item) =>
        item.dueDate && item.dueDate >= now && item.dueDate <= next30 && item.status !== 'COMPLETE',
    ).length;
    const documentExpiring = documents.filter((document_) =>
        document_.retentionExpires && document_.retentionExpires >= now && document_.retentionExpires <= next30,
    ).length;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <KpiCard
                title="Leave Balance"
                value={`${leaveBalance.toLocaleString()} days`}
                icon={Briefcase}
                href="/hr/leave/balances"
            />
            <KpiCard
                title="Pending Requests"
                value={pendingRequests.toString()}
                icon={Clock}
                href="/hr/leave/requests"
            />
            <KpiCard
                title="Absent Today"
                value={absentToday.toString()}
                icon={Calendar}
                href="/hr/absence"
            />
            <KpiCard
                title="Compliance due"
                value={complianceDueSoon.toString()}
                icon={ShieldCheck}
                href="/hr/compliance"
            />
            <KpiCard
                title="Docs expiring"
                value={documentExpiring.toString()}
                icon={ShieldCheck}
                href="/hr/documents"
            />
            {isAdmin && (
                <KpiCard
                    title="Total Employees"
                    value={totalEmployees.toString()}
                    icon={Users}
                    href="/hr/employees"
                />
            )}
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, href }: {
    title: string;
    value: string;
    icon: LucideIcon;
    href: string;
}) {
    return (
        <Link href={href}>
            <Card data-ui-surface="interactive" data-ui-interactive="true" className="group">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-bold">{value}</div>
                </CardContent>
            </Card>
        </Link>
    );
}

export function KpiGridSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </div>
                        <Skeleton className="h-8 w-16 mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
