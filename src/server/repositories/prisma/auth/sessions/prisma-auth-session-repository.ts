import { randomUUID } from 'node:crypto';

import type {
    AuthSessionRecord,
    AuthSessionUpsertInput,
    IAuthSessionRepository,
} from '@/server/repositories/contracts/auth/sessions/auth-session-repository-contract';
import {
    BasePrismaRepository,
    type BasePrismaRepositoryOptions,
} from '@/server/repositories/prisma/base-prisma-repository';

export class PrismaAuthSessionRepository extends BasePrismaRepository implements IAuthSessionRepository {
    constructor(options: BasePrismaRepositoryOptions = {}) {
        super(options);
    }

    async findByToken(token: string): Promise<AuthSessionRecord | null> {
        const record = await this.prisma.authSession.findUnique({
            where: { token },
            select: {
                id: true,
                token: true,
                userId: true,
                expiresAt: true,
                activeOrganizationId: true,
                ipAddress: true,
                userAgent: true,
            },
        });

        return record ?? null;
    }

    async upsertSessionByToken(input: AuthSessionUpsertInput): Promise<AuthSessionRecord> {
        const now = new Date();

        return this.prisma.authSession.upsert({
            where: { token: input.token },
            update: {
                userId: input.userId,
                expiresAt: input.expiresAt,
                activeOrganizationId: input.activeOrganizationId,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                updatedAt: now,
            },
            create: {
                id: randomUUID(),
                token: input.token,
                userId: input.userId,
                expiresAt: input.expiresAt,
                activeOrganizationId: input.activeOrganizationId,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                createdAt: now,
                updatedAt: now,
            },
            select: {
                id: true,
                token: true,
                userId: true,
                expiresAt: true,
                activeOrganizationId: true,
                ipAddress: true,
                userAgent: true,
            },
        });
    }

    async expireSessionByToken(token: string, at: Date = new Date()): Promise<number> {
        const result = await this.prisma.authSession.updateMany({
            where: { token },
            data: {
                expiresAt: at,
                updatedAt: at,
            },
        });

        return result.count;
    }
}
