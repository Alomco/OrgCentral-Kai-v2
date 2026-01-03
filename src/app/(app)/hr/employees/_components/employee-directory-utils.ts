import type { EmployeeProfile } from '@/server/types/hr-types';

import type { EmployeeDirectoryQuery } from './employee-directory-helpers';
import { formatEmployeeName } from './employee-formatters';

export interface EmployeeDirectoryStats {
    total: number;
    active: number;
    onLeave: number;
    newThisMonth: number;
}

function toSearchText(profile: EmployeeProfile): string {
    const values = [
        profile.displayName,
        profile.firstName,
        profile.lastName,
        profile.email,
        profile.personalEmail,
        profile.employeeNumber,
        profile.jobTitle,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    return values.join(' ').toLowerCase();
}

function matchesSearch(profile: EmployeeProfile, searchTokens: string[]): boolean {
    if (searchTokens.length === 0) {
        return true;
    }
    const haystack = toSearchText(profile);
    return searchTokens.every((token) => haystack.includes(token));
}

function toDateTimestamp(value: Date | string | null | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.getTime();
}

export function filterEmployeeDirectoryProfiles(
    profiles: EmployeeProfile[],
    query: Pick<EmployeeDirectoryQuery, 'search' | 'status' | 'employmentType'>,
): EmployeeProfile[] {
    const tokens = query.search
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0);

    return profiles.filter((profile) => {
        if (query.status && profile.employmentStatus !== query.status) {
            return false;
        }
        if (query.employmentType && profile.employmentType !== query.employmentType) {
            return false;
        }
        return matchesSearch(profile, tokens);
    });
}

export function sortEmployeeDirectoryProfiles(
    profiles: EmployeeProfile[],
    query: Pick<EmployeeDirectoryQuery, 'sort' | 'direction'>,
): EmployeeProfile[] {
    const direction = query.direction === 'asc' ? 1 : -1;
    const fallback = query.direction === 'asc' ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;

    return [...profiles].sort((a, b) => {
        switch (query.sort) {
            case 'startDate': {
                const dateA = toDateTimestamp(a.startDate, fallback);
                const dateB = toDateTimestamp(b.startDate, fallback);
                return (dateA - dateB) * direction;
            }
            case 'status': {
                const statusA = a.employmentStatus;
                const statusB = b.employmentStatus;
                return statusA.localeCompare(statusB) * direction;
            }
            case 'jobTitle': {
                const jobA = a.jobTitle ?? '';
                const jobB = b.jobTitle ?? '';
                return jobA.localeCompare(jobB) * direction;
            }
            case 'name':
            default: {
                const nameA = formatEmployeeName(a).toLowerCase();
                const nameB = formatEmployeeName(b).toLowerCase();
                return nameA.localeCompare(nameB) * direction;
            }
        }
    });
}

export function computeEmployeeDirectoryStats(
    profiles: EmployeeProfile[],
): EmployeeDirectoryStats {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const total = profiles.length;
    const active = profiles.filter((profile) => profile.employmentStatus === 'ACTIVE').length;
    const onLeave = profiles.filter((profile) => profile.employmentStatus === 'ON_LEAVE').length;
    const newThisMonth = profiles.filter((profile) => {
        const start = toDateTimestamp(profile.startDate, 0);
        return start >= monthStart.getTime();
    }).length;

    return { total, active, onLeave, newThisMonth };
}
