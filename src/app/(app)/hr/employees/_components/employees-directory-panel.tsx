import Link from 'next/link';
import { Clock, UserCheck, UserPlus, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { listEmployeeDirectoryForUi } from '@/server/use-cases/hr/people/list-employee-directory.cached';
import { getEmployeeDirectoryStatsForUi } from '@/server/use-cases/hr/people/get-employee-directory-stats.cached';

import { HrDataTable, HrStatCard } from '../../_components';
import { HrStatusBadge } from '../../_components/hr-status-badge';
import {
    formatDate,
    formatEmployeeName,
    formatEmploymentType,
    formatOptionalText,
} from './employee-formatters';
import type { EmploymentStatusCode, EmploymentTypeCode } from '@/server/types/hr/people';
import { EmployeesDirectoryPagination } from './employees-directory-pagination';
import type { EmployeeDirectoryQuery } from './employee-directory-helpers';
import { EmployeeQuickViewSheet, type EmployeeQuickViewProfile } from './employee-quick-view-sheet';

export interface EmployeesDirectoryPanelProps {
    authorization: RepositoryAuthorizationContext;
    query: EmployeeDirectoryQuery;
}

const COLUMNS = [
    { key: 'employee', label: 'Employee' },
    { key: 'job', label: 'Job title' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'start', label: 'Start date' },
    { key: 'actions', label: '', className: 'w-20 text-right' },
] as const;

const EMPLOYMENT_TYPE_CODES = [
    'FIXED_TERM',
    'FULL_TIME',
    'PART_TIME',
    'CONTRACTOR',
    'INTERN',
    'APPRENTICE',
    'CASUAL',
] as const satisfies readonly EmploymentTypeCode[];

const EMPLOYMENT_STATUS_CODES = [
    'ACTIVE',
    'INACTIVE',
    'TERMINATED',
    'ON_LEAVE',
    'OFFBOARDING',
    'ARCHIVED',
] as const satisfies readonly EmploymentStatusCode[];

function toEmploymentTypeCode(value: string | null | undefined): EmploymentTypeCode | null {
    if (value === null || value === undefined) {
        return null;
    }
    return (EMPLOYMENT_TYPE_CODES as readonly string[]).includes(value) ? (value as EmploymentTypeCode) : null;
}

function toEmploymentStatusCode(value: string | null | undefined): EmploymentStatusCode | null {
    if (value === null || value === undefined) {
        return null;
    }
    return (EMPLOYMENT_STATUS_CODES as readonly string[]).includes(value) ? (value as EmploymentStatusCode) : null;
}

export async function EmployeesDirectoryPanel({ authorization, query }: EmployeesDirectoryPanelProps) {
    const [stats, directory] = await Promise.all([
        getEmployeeDirectoryStatsForUi({ authorization }),
        listEmployeeDirectoryForUi({
            authorization,
            page: query.page,
            pageSize: query.pageSize,
            sort: { key: query.sort, direction: query.direction },
            filters: {
                search: query.search,
                employmentStatus: query.status,
                employmentType: query.employmentType,
                departmentId: query.departmentId,
                managerUserId: query.managerUserId,
                startDate: query.startDate,
                endDate: query.endDate,
            },
        }),
    ]);

    const totalCount = directory.totalCount;
    const pageCount = Math.max(1, Math.ceil(totalCount / directory.pageSize));
    const rangeStart = totalCount === 0 ? 0 : (directory.page - 1) * directory.pageSize + 1;
    const rangeEnd = totalCount === 0 ? 0 : Math.min(directory.page * directory.pageSize, totalCount);
    const pageProfiles = directory.profiles;
    const safeQuery = { ...query, page: directory.page, pageSize: directory.pageSize };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <HrStatCard
                    label="Total employees"
                    value={stats.total}
                    icon={<Users className="h-5 w-5" />}
                    accentColor="primary"
                />
                <HrStatCard
                    label="Active"
                    value={stats.active}
                    icon={<UserCheck className="h-5 w-5" />}
                    accentColor="success"
                />
                <HrStatCard
                    label="On leave"
                    value={stats.onLeave}
                    icon={<Clock className="h-5 w-5" />}
                    accentColor="warning"
                />
                <HrStatCard
                    label="New this month"
                    value={stats.newThisMonth}
                    icon={<UserPlus className="h-5 w-5" />}
                    accentColor="accent"
                />
            </div>

            <HrDataTable
                title="Employee directory"
                description="Search and manage employee records."
                columns={COLUMNS}
                isEmpty={pageProfiles.length === 0}
                emptyMessage="No employees matched the current filters."
            >
                {pageProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <Link
                                    href={`/hr/employees/${profile.id}`}
                                    className="text-sm font-semibold text-foreground hover:underline"
                                >
                                    {formatEmployeeName(profile)}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    {formatOptionalText(profile.email ?? profile.personalEmail ?? profile.employeeNumber)}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>{formatOptionalText(profile.jobTitle ?? null)}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{formatEmploymentType(profile.employmentType)}</Badge>
                        </TableCell>
                        <TableCell>
                            <HrStatusBadge status={profile.employmentStatus} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {formatDate(profile.startDate)}
                        </TableCell>
                        <TableCell className="text-right">
                            <EmployeeQuickViewSheet profile={toQuickViewProfile(profile)} />
                        </TableCell>
                    </TableRow>
                ))}
            </HrDataTable>

            <EmployeesDirectoryPagination
                query={safeQuery}
                totalCount={totalCount}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                pageCount={pageCount}
            />
        </div>
    );
}

function toQuickViewProfile(profile: {
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    employeeNumber?: string | null;
    email?: string | null;
    personalEmail?: string | null;
    jobTitle?: string | null;
    employmentType?: string | null;
    employmentStatus?: string | null;
    startDate?: string | Date | null;
}): EmployeeQuickViewProfile {
    const startDate =
        profile.startDate instanceof Date
            ? profile.startDate.toISOString()
            : typeof profile.startDate === 'string'
                ? profile.startDate
                : null;

    return {
        id: profile.id,
        displayName: profile.displayName ?? null,
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        employeeNumber: profile.employeeNumber ?? null,
        email: profile.email ?? null,
        personalEmail: profile.personalEmail ?? null,
        jobTitle: profile.jobTitle ?? null,
        employmentType: toEmploymentTypeCode(profile.employmentType),
        employmentStatus: toEmploymentStatusCode(profile.employmentStatus),
        startDate,
    };
}
