/**
 * Repository contract for Better Auth sessions.
 */

export interface AuthSessionRecord {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    activeOrganizationId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
}

export interface AuthSessionUpsertInput {
    token: string;
    userId: string;
    expiresAt: Date;
    activeOrganizationId: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface IAuthSessionRepository {
    findByToken(token: string): Promise<AuthSessionRecord | null>;
    upsertSessionByToken(input: AuthSessionUpsertInput): Promise<AuthSessionRecord>;
    expireSessionByToken(token: string, at?: Date): Promise<number>;
}
