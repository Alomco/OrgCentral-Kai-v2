/**
 * Absence Management Hub - Pending Acknowledgments Table (Server Component)
 * Single Responsibility: Display unacknowledged absences for admin review
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaUnplannedAbsenceRepository } from '@/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository';
import { getAbsences } from '@/server/use-cases/hr/absences/get-absences';

import { formatHumanDate } from '../../_components';
import { AbsenceAcknowledgeForm } from './absence-acknowledge-form';
import { absenceStatusBadgeVariant } from './absence-badge-variants';

export interface AbsenceManagementHubProps {
    authorization: RepositoryAuthorizationContext;
}

export async function AbsenceManagementHub({ authorization }: AbsenceManagementHubProps) {
    const deps = { absenceRepository: new PrismaUnplannedAbsenceRepository() };
    
    const { absences } = await getAbsences(deps, {
        authorization,
        filters: { status: 'REPORTED', includeClosed: false },
    });

    const pendingAbsences = absences.slice(0, 20);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">Pending Absence Acknowledgments</span>
                    <Badge variant="secondary">{pendingAbsences.length}</Badge>
                </CardTitle>
                <CardDescription>
                    Review and acknowledge reported absences
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingAbsences.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Type ID</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingAbsences.map((absence) => (
                                    <TableRow key={absence.id}>
                                        <TableCell className="font-medium font-mono text-xs">
                                            {absence.userId.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {absence.typeId.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatHumanDate(new Date(absence.startDate))}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatHumanDate(new Date(absence.endDate))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={absenceStatusBadgeVariant(absence.status)}>
                                                {absence.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatHumanDate(new Date(absence.createdAt))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AbsenceAcknowledgeForm absenceId={absence.id} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                No pending absences to acknowledge. All caught up!
            </p>
        </div>
    );
}
