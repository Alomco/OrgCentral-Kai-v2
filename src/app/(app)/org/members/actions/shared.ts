import type { AbacSubjectAttributes } from '@/server/types/abac-subject-attributes';

export type MemberActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string };

export type InviteMemberActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string; token: string; alreadyInvited: boolean }
    | { status: 'error'; message: string };

export function normalizeRoleList(input: string): string[] {
    const roles = input
        .split(',')
        .map((role) => role.trim())
        .filter((role) => role.length > 0);

    const first = roles[0];
    return [typeof first === 'string' ? first : 'member'];
}

export function parseAbacSubjectAttributes(input?: string): AbacSubjectAttributes | null {
    const trimmed = input?.trim();
    if (!trimmed) {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
    }

    const record = parsed as Record<string, unknown>;
    const result: AbacSubjectAttributes = {};

    for (const [key, raw] of Object.entries(record)) {
        if (key.trim().length === 0) {
            continue;
        }

        if (raw === null || typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
            result[key] = raw;
            continue;
        }

        if (
            Array.isArray(raw) &&
            raw.every((item) => item === null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
        ) {
            result[key] = raw;
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}
