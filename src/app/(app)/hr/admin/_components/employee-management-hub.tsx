/**
 * Employee Management Hub - Employee Directory Overview (Server Component)
 * Single Responsibility: Display employee stats and directory for admin management
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { UsersIcon, UserPlusIcon, UserCheckIcon, UserXIcon } from 'lucide-react';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { listEmployeeProfiles } from '@/server/use-cases/hr/people/list-employee-profiles';
import type { EmployeeProfileDTO, EmploymentStatusCode } from '@/server/types/hr/people';

import { formatHumanDate, HrStatCard } from '../../_components';
import type { EmployeeStats } from '../_types';
import { EmployeeDataOperationsCard } from './employee-data-operations-card';

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
                    label="Pending Onboarding" 
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Employees</CardTitle>
                            <CardDescription>Latest additions to your organization</CardDescription>
                        </div>
                        <Link 
                            href="/hr/onboarding/new" 
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            + Onboard New Employee
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentEmployees.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="overflow-auto">
                            <Table>
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
                                            <TableCell className="font-medium">
                                                {employee.firstName} {employee.lastName}
                                            </TableCell>
                                            <TableCell>{employee.jobTitle ?? '—'}</TableCell>
                                            <TableCell className="capitalize">
                                                {employee.employmentType.toLowerCase().replace('_', ' ')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(employee.employmentStatus)}>
                                                    {formatStatus(employee.employmentStatus)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
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
    return {
        total: profiles.length,
        active: profiles.filter(p => p.employmentStatus === 'ACTIVE').length,
        pendingOnboarding: profiles.filter(p => p.employmentStatus === 'OFFBOARDING').length,
        inactive: profiles.filter(p => p.employmentStatus === 'INACTIVE' || p.employmentStatus === 'TERMINATED').length,
    };
}

function getStatusVariant(status: EmploymentStatusCode): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'ACTIVE': return 'default';
        case 'ON_LEAVE': return 'secondary';
        case 'OFFBOARDING': return 'secondary';
        case 'INACTIVE': return 'destructive';
        case 'TERMINATED': return 'destructive';
        case 'ARCHIVED': return 'outline';
        default: return 'outline';
    }
}

function formatStatus(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
                No employees yet. Start onboarding your first team member!
            </p>
            <Link 
                href="/hr/onboarding/new"
                className="mt-4 text-sm font-medium text-primary hover:underline"
            >
                Onboard First Employee →
            </Link>
        </div>
    );
}
