import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import { PrismaUnplannedAbsenceRepository } from '@/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository';
import { getAbsences } from '@/server/use-cases/hr/absences/get-absences';
import { listAbsenceTypeConfigsForUi } from '@/server/use-cases/hr/absences/list-absence-type-configs.cached';
import { listEmployeeProfilesForUi } from '@/server/use-cases/hr/people/list-employee-profiles.cached';
import { coerceAbsenceMetadata } from '@/server/domain/absences/metadata';

import { formatHumanDate } from '../../_components';
import { formatEmployeeName } from '../../employees/_components/employee-formatters';
import { AbsenceAcknowledgeForm } from './absence-acknowledge-form';
import { AbsenceManagementRowActions } from './absence-management-row-actions';
import { absenceStatusBadgeVariant } from './absence-badge-variants';

export interface AbsenceManagementHubProps {
    authorization: RepositoryAuthorizationContext;
}

type AbsenceTableRow = UnplannedAbsence & { employeeName: string; typeLabel: string; lifecycleNotes: string | null };

const HISTORY_STATUSES = new Set<UnplannedAbsence['status']>(['CLOSED', 'CANCELLED', 'REJECTED']);

export async function AbsenceManagementHub({ authorization }: AbsenceManagementHubProps) {
    const deps = { absenceRepository: new PrismaUnplannedAbsenceRepository() };

    const [{ absences }, { types }, profileResult] = await Promise.all([
        getAbsences(deps, {
            authorization,
            filters: { includeClosed: true },
        }),
        listAbsenceTypeConfigsForUi({ authorization }),
        listEmployeeProfilesForUi({ authorization }).catch(() => ({ profiles: [] })),
    ]);

    const profileLookup = new Map(profileResult.profiles.map((profile) => [profile.userId, profile] as const));
    const typeLookup = new Map(types.map((type) => [type.id, type.label] as const));

    const rows: AbsenceTableRow[] = absences.map((absence) => {
        const profile = profileLookup.get(absence.userId);
        const metadata = coerceAbsenceMetadata(absence.metadata);
        const lifecycleNotes = resolveLifecycleNotes(metadata, absence.returnToWork?.comments ?? null);
        return {
            ...absence,
            employeeName: profile ? formatEmployeeName(profile) : 'Unknown employee',
            typeLabel: typeLookup.get(absence.typeId) ?? absence.typeId,
            lifecycleNotes,
        };
    });

    const pending = rows.filter((absence) => absence.status === 'REPORTED');
    const ongoing = rows.filter((absence) => absence.status === 'APPROVED');
    const history = rows.filter((absence) => HISTORY_STATUSES.has(absence.status));

    return (
        <div className="space-y-6">
            <AbsenceTable
                title="Pending acknowledgements"
                description="Reported absences awaiting acknowledgment."
                rows={pending}
                authorization={authorization}
                showNotes
                emptyMessage="No pending absences to acknowledge."
                renderActions={(absence) => (
                    <AbsenceAcknowledgeForm absenceId={absence.id} />
                )}
            />

            <AbsenceTable
                title="Ongoing absences"
                description="Approved absences that are still in progress."
                rows={ongoing}
                authorization={authorization}
                showNotes
                emptyMessage="No ongoing absences right now."
                renderActions={(absence) => (
                    <AbsenceManagementRowActions
                        authorization={authorization}
                        absenceId={absence.id}
                        canCancel
                    />
                )}
            />

            <AbsenceTable
                title="Absence history"
                description="Closed, cancelled, or rejected absences."
                rows={history}
                authorization={authorization}
                showNotes
                emptyMessage="No historical absences yet."
                renderActions={(absence) => (
                    <AbsenceManagementRowActions
                        authorization={authorization}
                        absenceId={absence.id}
                        canCancel={false}
                    />
                )}
            />
        </div>
    );
}

function AbsenceTable(props: {
    title: string;
    description: string;
    rows: AbsenceTableRow[];
    authorization: RepositoryAuthorizationContext;
    showNotes?: boolean;
    emptyMessage: string;
    renderActions: (row: AbsenceTableRow) => ReactNode;
}) {
    const { rows, showNotes = false } = props;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">{props.title}</span>
                    <Badge variant="secondary">{rows.length}</Badge>
                </CardTitle>
                <CardDescription>{props.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{props.emptyMessage}</p>
                ) : (
                    <div className="overflow-auto">
                        <Table className="min-w-[860px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Start</TableHead>
                                    <TableHead>End</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reported</TableHead>
                                    {showNotes ? <TableHead>Notes</TableHead> : null}
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((absence) => (
                                    <TableRow key={absence.id}>
                                        <TableCell className="font-medium min-w-0 max-w-[200px] truncate">
                                            {absence.employeeName}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                                            {absence.typeLabel}
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
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {formatHumanDate(new Date(absence.createdAt))}
                                        </TableCell>
                                        {showNotes ? (
                                            <TableCell className="text-xs text-muted-foreground max-w-[260px]">
                                                <span className="block line-clamp-2" title={absence.lifecycleNotes ?? '—'}>
                                                    {absence.lifecycleNotes ?? '—'}
                                                </span>
                                            </TableCell>
                                        ) : null}
                                        <TableCell className="text-right align-top">
                                            {props.renderActions(absence)}
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

function resolveLifecycleNotes(
    metadata: ReturnType<typeof coerceAbsenceMetadata>,
    returnNotes: string | null,
): string | null {
    const notes: string[] = [];

    if (metadata.cancellation?.reason) {
        notes.push(`Cancelled: ${metadata.cancellation.reason}`);
    }

    if (returnNotes) {
        notes.push(`Return to work: ${returnNotes}`);
    }

    const acknowledgements = Array.isArray(metadata.acknowledgements) ? metadata.acknowledgements : [];
    const latestAck = acknowledgements
        .filter((entry) => entry.note && entry.note.trim().length > 0)
        .at(-1);

    if (latestAck?.note) {
        notes.push(`Acknowledged: ${latestAck.note.trim()}`);
    }

    return notes.length > 0 ? notes.join(' • ') : null;
}
