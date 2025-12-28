import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { Prisma, type PrismaClient, type Invitation as PrismaInvitation } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type {
    IInvitationRepository,
    InvitationRecord,
    InvitationStatusUpdate,
    InvitationCreateInput,
} from '@/server/repositories/contracts/auth/invitations';
import { resolveIdentityCacheScopes } from '@/server/lib/cache-tags/identity';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { RepositoryAuthorizationError } from '@/server/repositories/security';

type InvitationEntity = PrismaInvitation;

type InvitationDelegate = PrismaClient['invitation'];

import { mapPrismaInvitationToInvitationRecord } from '@/server/repositories/mappers/auth/invitation-mapper';

function mapInvitation(record: InvitationEntity): InvitationRecord {
    return {
        ...mapPrismaInvitationToInvitationRecord(record),
    };
}

export class PrismaInvitationRepository extends BasePrismaRepository implements IInvitationRepository {
    async findByToken(token: string): Promise<InvitationRecord | null> {
        const record = await getInvitationDelegate(this.prisma).findUnique({ where: { token } });
        if (!record) {
            return null;
        }

        return mapInvitation(record);
    }

    async getActiveInvitationByEmail(orgId: string, email: string): Promise<InvitationRecord | null> {
        const normalized = email.trim().toLowerCase();
        const record = await getInvitationDelegate(this.prisma).findFirst({
            where: {
                orgId,
                targetEmail: { equals: normalized, mode: 'insensitive' },
                status: 'pending',
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: { createdAt: 'desc' },
        });

        return record ? mapInvitation(record) : null;
    }

    async listInvitationsByOrg(
        orgId: string,
        options?: { status?: InvitationRecord['status']; limit?: number },
    ): Promise<InvitationRecord[]> {
        const limit = options?.limit ?? 25;
        const records = await getInvitationDelegate(this.prisma).findMany({
            where: {
                orgId,
                status: options?.status,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return records.map((record) => mapInvitation(record));
    }

    async createInvitation(input: InvitationCreateInput): Promise<InvitationRecord> {
        const token = `${input.orgId}-${randomUUID()}`;
        const targetEmail = input.targetEmail.trim().toLowerCase();

        const record = await getInvitationDelegate(this.prisma).create({
            data: {
                token,
                orgId: input.orgId,
                organizationName: input.organizationName,
                targetEmail,
                onboardingData:
                    toPrismaInputJson(
                        input.onboardingData as unknown as Prisma.InputJsonValue,
                    ) ?? Prisma.JsonNull,
                status: 'pending',
                invitedByUserId: input.invitedByUserId ?? null,
                expiresAt: input.expiresAt ?? null,
                metadata:
                    toPrismaInputJson(
                        input.metadata as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
                    ) ?? Prisma.JsonNull,
                securityContext:
                    toPrismaInputJson(
                        input.securityContext as Prisma.InputJsonValue | Prisma.JsonValue | null | undefined,
                    ) ?? Prisma.JsonNull,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
            },
        });

        await this.invalidateAfterWrite(input.orgId, resolveIdentityCacheScopes());
        return mapInvitation(record);
    }

    async updateStatus(token: string, update: InvitationStatusUpdate): Promise<void> {
        const existing = await getInvitationDelegate(this.prisma).findUnique({ where: { token } });
        await getInvitationDelegate(this.prisma).update({
            where: { token },
            data: {
                status: update.status,
                acceptedByUserId: update.acceptedByUserId,
                acceptedAt: update.acceptedAt,
            },
        });

        const orgId = existing?.orgId;
        if (orgId) {
            await this.invalidateAfterWrite(orgId, resolveIdentityCacheScopes());
        }
    }

    async revokeInvitation(orgId: string, token: string, revokedByUserId: string, reason?: string): Promise<void> {
        const record = await getInvitationDelegate(this.prisma).findUnique({ where: { token } });
        if (record?.orgId !== orgId) {
            throw new RepositoryAuthorizationError('Invitation not found for this organization.');
        }

        const metadata = (record.metadata ?? {}) as Record<string, unknown>;
        const nextMetadata = {
            ...metadata,
            revocationReason: reason ?? metadata.revocationReason,
        };

        await getInvitationDelegate(this.prisma).update({
            where: { token },
            data: {
                status: 'revoked',
                revokedByUserId,
                revokedAt: new Date(),
                metadata:
                    toPrismaInputJson(
                        nextMetadata as Record<string, Prisma.InputJsonValue> | Prisma.InputJsonValue,
                    ) ?? Prisma.JsonNull,
            },
        });

        await this.invalidateAfterWrite(orgId, resolveIdentityCacheScopes());
    }
}

function getInvitationDelegate(prisma: unknown): InvitationDelegate {
    const delegateHolder = prisma as { invitation?: unknown };
    const delegate = delegateHolder.invitation;
    if (!delegate || typeof delegate !== 'object') {
        throw new Error('Invitation delegate is not available on the Prisma client.');
    }

    const candidate = delegate as Partial<InvitationDelegate>;
    if (
        typeof candidate.findUnique !== 'function' ||
        typeof candidate.findFirst !== 'function' ||
        typeof candidate.create !== 'function' ||
        typeof candidate.update !== 'function'
    ) {
        throw new Error('Invitation delegate is missing required methods.');
    }

    return candidate as InvitationDelegate;
}
