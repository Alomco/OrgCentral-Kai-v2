import { cache } from 'react';

import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import { getTimeTrackingService } from '@/server/services/hr/time-tracking/time-tracking-service.provider';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export interface PendingTimeEntry {
    id: string;
    employeeName: string;
    date: Date;
    clockIn: Date;
    clockOut?: Date | null;
    totalHours?: number | null;
    project?: string | null;
}

export const buildPendingTimeEntries = cache(async (
    authorization: RepositoryAuthorizationContext,
): Promise<PendingTimeEntry[]> => {
    const peopleService = getPeopleService();
    const profilesResult = await peopleService.listEmployeeProfiles({
        authorization,
        payload: {},
    }).catch(() => ({ profiles: [] }));

    const directReports = profilesResult.profiles.filter(
        (profile) => profile.managerUserId === authorization.userId,
    );
    if (directReports.length === 0) {
        return [];
    }

    const profileByUserId = new Map(
        directReports.map((profile) => [profile.userId, profile]),
    );

    const timeTrackingService = getTimeTrackingService();
    const entriesResult = await timeTrackingService.listTimeEntries({
        authorization,
        filters: { status: 'COMPLETED' },
    }).catch(() => ({ entries: [] }));

    return entriesResult.entries
        .filter((entry) => profileByUserId.has(entry.userId))
        .map((entry) => {
            const profile = profileByUserId.get(entry.userId);
            const name = resolveProfileName(profile);

            return {
                id: entry.id,
                employeeName: name,
                date: entry.date,
                clockIn: entry.clockIn,
                clockOut: entry.clockOut,
                totalHours: resolveTotalHours(entry.totalHours),
                project: entry.project,
            };
        });
});

function resolveProfileName(profile?: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}): string {
    if (!profile) {
        return 'Employee';
    }
    const displayName = profile.displayName?.trim();
    if (displayName) {
        return displayName;
    }
    const firstName = profile.firstName?.trim() ?? '';
    const lastName = profile.lastName?.trim() ?? '';
    const fallback = `${firstName} ${lastName}`.trim();
    return fallback.length > 0 ? fallback : 'Employee';
}

function resolveTotalHours(
    value: number | { toNumber?: () => number } | null | undefined,
): number | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    return null;
}
