/**
 * Employee Management Hub - Employee Directory Overview (Server Component)
 * Single Responsibility: Display employee stats and directory for admin management
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UsersIcon, UserPlusIcon, UserCheckIcon, UserXIcon } from 'lucide-react';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { listEmployeeProfiles } from '@/server/use-cases/hr/people/list-employee-profiles';
import type { EmployeeProfileDTO, EmploymentStatusCode } from '@/server/types/hr/people';

import { formatHumanDate, HrStatCard } from '../../_components';
import { IntentPrefetchLink } from '@/components/navigation/intent-prefetch-link';
import type { EmployeeStats } from '../_types';
import { EmployeeDataOperationsCard } from './employee-data-operations-card';

const STATUS_VARIANTS = new Map<EmploymentStatusCode, 'default' | 'secondary' | 'destructive' | 'outline'>([
    ['ACTIVE', 'default'],
    ['ON_LEAVE', 'secondary'],
    ['OFFBOARDING', 'secondary'],
    ['INACTIVE', 'destructive'],
    ['TERMINATED', 'destructive'],
    ['ARCHIVED', 'outline'],
]);

const STATUS_SEPARATOR_REGEX = /_/g;
const WORD_START_REGEX = /\b\w/g;

export interface EmployeeManagementHubProps {
    authorization: RepositoryAuthorizationContext;
}

export async function EmployeeManagementHub({ authorization }: EmployeeManagementHubProps) {
    const deps = { employeeProfileRepository: new PrismaEmployeeProfileRepository() };

    const { profiles } = await listEmployeeProfiles(deps, { authorization });

    const stats = computeEmployeeStats(profiles);
    const recentEmployees = [...profiles]
        .sort((a, b) => {
            const dateA = a.startDate ? new Date(String(a.startDate)).getTime() : 0;
            const dateB = b.startDate ? new Date(String(b.startDate)).getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <HrStatCard
                    label="Total Employees"
                    value={stats.total}
                    icon={<UsersIcon className="h-5 w-5" />}
                    accentColor="primary"
                />
                <HrStatCard
                    label="Active"
                    value={stats.active}
                    icon={<UserCheckIcon className="h-5 w-5" />}
                    accentColor="success"
                />
                <HrStatCard
                    label="Offboarding"
                    value={stats.pendingOnboarding}
                    icon={<UserPlusIcon className="h-5 w-5" />}
                    accentColor="warning"
                />
                <HrStatCard
                    label="Inactive"
                    value={stats.inactive}
                    icon={<UserXIcon className="h-5 w-5" />}
                    accentColor="accent"
                />
            </div>

            <EmployeeDataOperationsCard />

            {/* Recent Employees Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Recent Employees</CardTitle>
                            <CardDescription>Latest additions to your organization</CardDescription>
                        </div>
                        <IntentPrefetchLink
                            href="/hr/onboarding/new"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            + Onboard New Employee
                        </IntentPrefetchLink>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentEmployees.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="overflow-auto">
                            <Table className="min-w-[720px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Job Title</TableHead>
                                        <TableHead>Employment Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Start Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="font-medium min-w-0 max-w-[200px] truncate">
                                                {employee.firstName} {employee.lastName}
                                            </TableCell>
                                            <TableCell className="min-w-0 max-w-[220px] truncate">
                                                {employee.jobTitle ?? '—'}
                                            </TableCell>
                                            <TableCell className="capitalize whitespace-nowrap">
                                                {employee.employmentType.toLowerCase().replace('_', ' ')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(employee.employmentStatus)}>
                                                    {formatStatus(employee.employmentStatus)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {employee.startDate
                                                    ? formatHumanDate(new Date(String(employee.startDate)))
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function computeEmployeeStats(profiles: EmployeeProfileDTO[]): EmployeeStats {
    return profiles.reduce<EmployeeStats>((accumulator, profile) => {
        accumulator.total += 1;
        if (profile.employmentStatus === 'ACTIVE') {
            accumulator.active += 1;
        }
        if (profile.employmentStatus === 'OFFBOARDING') {
            accumulator.pendingOnboarding += 1;
        }
        if (profile.employmentStatus === 'INACTIVE' || profile.employmentStatus === 'TERMINATED') {
            accumulator.inactive += 1;
        }
        return accumulator;
    }, {
        total: 0,
        active: 0,
        pendingOnboarding: 0,
        inactive: 0,
    });
}

function getStatusVariant(status: EmploymentStatusCode): 'default' | 'secondary' | 'destructive' | 'outline' {
    return STATUS_VARIANTS.get(status) ?? 'outline';
}

function formatStatus(status: string): string {
    return status
        .replace(STATUS_SEPARATOR_REGEX, ' ')
        .toLowerCase()
        .replace(WORD_START_REGEX, (character) => character.toUpperCase());
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
                No employees yet. Start onboarding your first team member!
            </p>
            <IntentPrefetchLink
                href="/hr/onboarding/new"
                className="mt-4 text-sm font-medium text-primary hover:underline"
            >
                Onboard First Employee →
            </IntentPrefetchLink>
        </div>
    );
}
