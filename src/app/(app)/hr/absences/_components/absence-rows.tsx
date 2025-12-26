'use client';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

import { AbsenceRow, type AbsenceRowData } from './absence-row';

export interface AbsenceRowsProps {
    absences: AbsenceRowData[];
    authorization: RepositoryAuthorizationContext;
}

/**
 * Client wrapper for absence rows with interactive actions.
 * Minimal "use client" island pattern for optimized hydration.
 */
export function AbsenceRows({ absences, authorization }: AbsenceRowsProps) {
    return (
        <>
            {absences.map((absence) => (
                <AbsenceRow
                    key={absence.id}
                    absence={absence}
                    authorization={authorization}
                />
            ))}
        </>
    );
}
