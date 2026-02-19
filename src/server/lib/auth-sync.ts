import { MembershipStatus, Prisma, SessionStatus } from '../../generated/client';
import { prisma } from '@/server/lib/prisma';
import { appLogger } from '@/server/logging/structured-logger';

const MEMBERSHIP_STATUS_LOOKUP: Record<string, MembershipStatus> = {
    active: MembershipStatus.ACTIVE,
    invited: MembershipStatus.INVITED,
    suspended: MembershipStatus.SUSPENDED,
    deactivated: MembershipStatus.DEACTIVATED,
};

const SESSION_STATUS_LOOKUP: Record<string, SessionStatus> = {
    active: SessionStatus.active,
    inactive: SessionStatus.inactive,
    expired: SessionStatus.expired,
    revoked: SessionStatus.revoked,
};

type DateInput = string | number | Date | null | undefined;

export interface BetterAuthUserPayload extends Record<string, unknown> {
    id: string;
    email?: string | null;
    name?: string | null;
    emailVerified?: boolean;
    status?: string | null;
    lockedUntil?: DateInput;
    lastSignInAt?: DateInput;
    passwordChangedAt?: DateInput;
    createdAt?: DateInput;
    updatedAt?: DateInput;
}

export interface BetterAuthSessionPayload extends Record<string, unknown> {
    id: string;
    userId?: string;
    token?: string;
    expiresAt?: DateInput;
    createdAt?: DateInput;
    updatedAt?: DateInput;
    ipAddress?: string | null;
    userAgent?: string | null;
    status?: string | null;
    metadata?: unknown;
}

export async function syncBetterAuthUserToPrisma(payload: BetterAuthUserPayload): Promise<void> {
    if (!payload.id) {
        return;
    }

    const email = normalizeEmail(payload.email);
    if (!email) {
        appLogger.warn('Better Auth user sync skipped because email is missing', { userId: payload.id });
        return;
    }

    const now = new Date();
    const lastLoginAt = toDate(payload.lastSignInAt ?? payload.updatedAt);
    const lastPasswordChange = toDate(payload.passwordChangedAt ?? payload.updatedAt) ?? now;
    const lockedUntil = toDate(payload.lockedUntil) ?? null;
    const createdAt = toDate(payload.createdAt);
    const status = resolveMembershipStatus(payload);
    const displayName = normalizeDisplayName(payload.name);

    try {
        await prisma.user.upsert({
            where: { id: payload.id },
            create: {
                id: payload.id,
                email,
                displayName: displayName ?? undefined,
                status,
                authProvider: 'better-auth',
                lastLoginAt: lastLoginAt ?? null,
                lockedUntil,
                lastPasswordChange,
                ...(createdAt ? { createdAt } : {}),
            },
            update: {
                email,
                displayName: displayName ?? undefined,
                status,
                authProvider: 'better-auth',
                lockedUntil,
                lastPasswordChange,
                ...(lastLoginAt ? { lastLoginAt } : {}),
            },
        });

        appLogger.debug('Synced Better Auth user into tenant directory', { userId: payload.id });
    } catch (error) {
        appLogger.error('Failed to sync Better Auth user into tenant directory', {
            userId: payload.id,
            error: serializeError(error),
        });
        throw error;
    }
}

export async function syncBetterAuthSessionToPrisma(payload: BetterAuthSessionPayload): Promise<void> {
    if (!payload.id || !payload.userId) {
        appLogger.warn('Better Auth session sync skipped due to missing identifiers', {
            sessionId: payload.id,
            userId: payload.userId,
        });
        return;
    }

    const now = new Date();
    const sessionToken = normalizeToken(payload.token) ?? payload.id;
    const startedAt = toDate(payload.createdAt) ?? now;
    const expiresAt = toDate(payload.expiresAt) ?? new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const lastAccess = toDate(payload.updatedAt) ?? startedAt;
    const status = resolveSessionStatus(payload.status);
    const metadataValue = toMetadata(payload.metadata);
    const revokedAt = status === SessionStatus.revoked ? lastAccess : null;

    try {
        await prisma.userSession.upsert({
            where: { id: payload.id },
            create: {
                id: payload.id,
                userId: payload.userId,
                sessionId: sessionToken,
                status,
                ipAddress: payload.ipAddress ?? null,
                userAgent: payload.userAgent ?? null,
                startedAt,
                expiresAt,
                lastAccess,
                revokedAt,
                metadata: metadataValue,
            },
            update: {
                sessionId: sessionToken,
                status,
                ipAddress: payload.ipAddress ?? null,
                userAgent: payload.userAgent ?? null,
                expiresAt,
                lastAccess,
                revokedAt,
                metadata: metadataValue,
            },
        });
    } catch (error) {
        appLogger.error('Failed to sync Better Auth session into compliance ledger', {
            sessionId: payload.id,
            userId: payload.userId,
            error: serializeError(error),
        });
        throw error;
    }

    if (status === SessionStatus.active) {
        await prisma.user
            .update({ where: { id: payload.userId }, data: { lastLoginAt: lastAccess } })
            .catch((error: unknown) => {
                appLogger.warn('Unable to update last login timestamp after session sync', {
                    userId: payload.userId,
                    error: serializeError(error),
                });
            });
    }

    appLogger.debug('Synced Better Auth session into compliance ledger', {
        sessionId: payload.id,
        userId: payload.userId,
    });
}

function normalizeEmail(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
}

function normalizeDisplayName(value?: string | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeToken(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function resolveMembershipStatus(payload: BetterAuthUserPayload): MembershipStatus {
    const statusKey = typeof payload.status === 'string' ? payload.status.toLowerCase() : undefined;
    if (statusKey && statusKey in MEMBERSHIP_STATUS_LOOKUP) {
        return MEMBERSHIP_STATUS_LOOKUP[statusKey];
    }

    return payload.emailVerified ? MembershipStatus.ACTIVE : MembershipStatus.INVITED;
}

function resolveSessionStatus(status?: string | null): SessionStatus {
    if (typeof status === 'string') {
        const normalized = status.toLowerCase();
        if (normalized in SESSION_STATUS_LOOKUP) {
            return SESSION_STATUS_LOOKUP[normalized];
        }
    }
    return SessionStatus.active;
}

function toDate(value: DateInput): Date | undefined {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return value;
    }
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
}

function toMetadata(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return Prisma.JsonNull;
    }
    if (typeof value === 'object') {
        return value as Prisma.InputJsonValue;
    }
    return undefined;
}

function serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
        };
    }
    return { value: error };
}
