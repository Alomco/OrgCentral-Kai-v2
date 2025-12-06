import type { UserSession } from '@/server/types/hr-types';
import { Prisma, type UserSession as PrismaUserSession } from '@prisma/client';

type JsonLike = Prisma.JsonValue | Prisma.InputJsonValue | typeof Prisma.DbNull | typeof Prisma.JsonNull | null | undefined;

const toMetadataInput = (value: JsonLike): Prisma.InputJsonValue | typeof Prisma.DbNull | typeof Prisma.JsonNull | undefined => (
    value === null ? (Prisma.JsonNull as unknown as Prisma.InputJsonValue) : value ?? undefined
);

type DomainUserSessionInput = Omit<UserSession, 'id'> & Partial<Pick<UserSession, 'id'>>;

export function mapPrismaUserSessionToDomain(record: PrismaUserSession): UserSession {
    return {
        id: record.id,
        userId: record.userId,
        sessionId: record.sessionId,
        status: record.status,
        ipAddress: record.ipAddress ?? null,
        userAgent: record.userAgent ?? null,
        startedAt: record.startedAt,
        expiresAt: record.expiresAt,
        lastAccess: record.lastAccess,
        revokedAt: record.revokedAt ?? null,
        metadata: record.metadata,
    };
}

export function mapDomainUserSessionToPrisma(input: DomainUserSessionInput): Prisma.UserSessionUncheckedCreateInput {
    return {
        id: input.id,
        userId: input.userId,
        sessionId: input.sessionId,
        status: input.status,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        startedAt: input.startedAt,
        expiresAt: input.expiresAt,
        lastAccess: input.lastAccess,
        revokedAt: input.revokedAt ?? null,
        metadata: toMetadataInput(input.metadata),
    };
}

export const toUserSessionMetadataInput = toMetadataInput;
