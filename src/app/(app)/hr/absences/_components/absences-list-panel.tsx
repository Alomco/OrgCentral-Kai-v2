import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getAbsencesForUi } from '@/server/use-cases/hr/absences/get-absences.cached';

import { HrDataTable, type HrDataTableColumn } from '../../_components/hr-data-table';
import { AbsenceRows } from '../../absence/_components/absence-rows';
import type { AbsenceRowData } from '../../absence/_components/absence-row';

export interface AbsencesPanelProps {
    authorization: RepositoryAuthorizationContext;
    userId?: string;
    includeClosed?: boolean;
    title?: string;
    description?: string;
    emptyMessage?: string;
}

const COLUMNS: readonly HrDataTableColumn[] = [
    { key: 'type', label: '📋 Type' },
    { key: 'dates', label: '📅 Dates' },
    { key: 'hours', label: '⏱️ Hours', className: 'text-right' },
    { key: 'status', label: '🏷️ Status' },
    { key: 'reported', label: '📝 Reported' },
    { key: 'actions', label: '', className: 'w-12' },
] as const;

function toNumber(value: number | { toNumber?: () => number } | null | undefined): number {
    if (value === null || value === undefined) {
        return 0;
    }
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    return Number(value);
}

/** Server component: fetches absences and renders the interactive list panel. */
export async function AbsenceListPanel({
    authorization,
    userId,
    includeClosed = false,
    title = '📊 Recent Absences',
    description = 'Unplanned absences and leave reports',
    emptyMessage = '✨ No absences recorded yet — looking good!',
}: AbsencesPanelProps) {
    const result = await getAbsencesForUi({
        authorization,
        userId,
        includeClosed,
    });

    const absences: AbsenceRowData[] = result.absences.map((absence) => ({
        id: absence.id,
        typeId: absence.typeId,
        startDate: absence.startDate,
        endDate: absence.endDate,
        hours: toNumber(absence.hours),
        reason: absence.reason ?? null,
        status: absence.status,
        createdAt: absence.createdAt,
    }));

    return (
        <HrDataTable
            title={title}
            description={description}
            columns={COLUMNS}
            isEmpty={absences.length === 0}
            emptyMessage={emptyMessage}
        >
            <AbsenceRows
                absences={absences}
                authorization={authorization}
            />
        </HrDataTable>
    );
}
