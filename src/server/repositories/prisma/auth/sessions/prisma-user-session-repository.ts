import type { Prisma } from '@prisma/client';
import { SessionStatus, type SessionStatus as PrismaSessionStatus } from '@prisma/client';
import type { UserSession as DomainUserSession } from '@/server/types/hr-types';
import { mapPrismaUserSessionToDomain, mapDomainUserSessionToPrisma, toUserSessionMetadataInput } from '@/server/repositories/mappers/auth/sessions/user-session-mapper';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IUserSessionRepository } from '@/server/repositories/contracts/auth/sessions/user-session-repository-contract';
import type { UserSessionFilters } from './prisma-user-session-repository.types';

export class PrismaUserSessionRepository extends BasePrismaRepository implements IUserSessionRepository {
  async findById(id: string): Promise<DomainUserSession | null> {
    const record = await this.prisma.userSession.findUnique({ where: { id } });
    if (!record) { return null; }
    return mapPrismaUserSessionToDomain(record);
  }

  async findBySessionId(sessionId: string): Promise<DomainUserSession | null> {
    const record = await this.prisma.userSession.findFirst({ where: { sessionId } });
    if (!record) { return null; }
    return mapPrismaUserSessionToDomain(record);
  }

  async findByUser(userId: string): Promise<DomainUserSession[]> {
    const records = await this.prisma.userSession.findMany({
      where: {
        userId,
        status: { in: [SessionStatus.active, SessionStatus.inactive] },
      },
      orderBy: { startedAt: 'desc' },
    });
    return records.map(mapPrismaUserSessionToDomain);
  }

  async findAll(filters?: UserSessionFilters): Promise<DomainUserSession[]> {
    const whereClause: Prisma.UserSessionWhereInput = {};

    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters?.sessionId) {
      whereClause.sessionId = filters.sessionId;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.ipAddress) {
      whereClause.ipAddress = { contains: filters.ipAddress, mode: 'insensitive' };
    }

    const dateFrom = filters?.dateFrom;
    const dateTo = filters?.dateTo;
    if (dateFrom || dateTo) {
      const startedAt: Prisma.DateTimeFilter = {};
      if (dateFrom) { startedAt.gte = dateFrom; }
      if (dateTo) { startedAt.lte = dateTo; }
      whereClause.startedAt = startedAt;
    }

    const records = await this.prisma.userSession.findMany({ where: whereClause, orderBy: { startedAt: 'desc' } });
    return records.map(mapPrismaUserSessionToDomain);
  }

  async create(data: Prisma.UserSessionUncheckedCreateInput): Promise<DomainUserSession> {
    const createPayload: Prisma.UserSessionUncheckedCreateInput = {
      ...data,
      status: data.status ?? SessionStatus.active,
      startedAt: data.startedAt ?? new Date(),
      metadata: toUserSessionMetadataInput(data.metadata),
    };
    const record = await this.prisma.userSession.create({ data: createPayload });
    return mapPrismaUserSessionToDomain(record);
  }

  async update(id: string, data: Prisma.UserSessionUncheckedUpdateInput): Promise<DomainUserSession> {
    const updatePayload: Prisma.UserSessionUncheckedUpdateInput = {
      ...data,
      metadata: toUserSessionMetadataInput(data.metadata),
    };
    const record = await this.prisma.userSession.update({ where: { id }, data: updatePayload });
    return mapPrismaUserSessionToDomain(record);
  }

  async delete(id: string): Promise<DomainUserSession> {
    const record = await this.prisma.userSession.delete({ where: { id } });
    return mapPrismaUserSessionToDomain(record);
  }

  async revokeSession(id: string): Promise<DomainUserSession> {
    const record = await this.prisma.userSession.update({ where: { id }, data: { status: SessionStatus.revoked, revokedAt: new Date() } });
    return mapPrismaUserSessionToDomain(record);
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.userSession.updateMany({ where: { userId, status: { in: [SessionStatus.active, SessionStatus.inactive] } }, data: { status: SessionStatus.revoked, revokedAt: new Date() } });
    return result.count;
  }

  async updateLastAccess(id: string): Promise<DomainUserSession> {
    const record = await this.prisma.userSession.update({ where: { id }, data: { lastAccess: new Date() } });
    return mapPrismaUserSessionToDomain(record);
  }

  async cleanupExpiredSessionsInternal(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        OR: [
          {
            status: SessionStatus.expired,
            expiresAt: { lt: new Date() }
          },
          {
            expiresAt: { lt: new Date() }
          }
        ]
      }
    });
    return result.count;
  }

  // --- Contract-facing methods ---
  async createUserSession(tenantId: string, session: Omit<DomainUserSession, 'id'>): Promise<void> {
    await this.create(mapDomainUserSessionToPrisma(session));
  }

  async updateUserSession(tenantId: string, sessionId: string, updates: Partial<Omit<DomainUserSession, 'id' | 'userId' | 'sessionId'>>): Promise<void> {
    const existing = await this.findBySessionId(sessionId);
    if (!existing) { throw new Error('Session not found'); }
    const prismaUpdates: Prisma.UserSessionUncheckedUpdateInput = {};
    const partial = updates;
    if (partial.status !== undefined) { prismaUpdates.status = partial.status; }
    if (partial.ipAddress !== undefined) { prismaUpdates.ipAddress = partial.ipAddress ?? null; }
    if (partial.userAgent !== undefined) { prismaUpdates.userAgent = partial.userAgent ?? null; }
    if (partial.startedAt !== undefined) { prismaUpdates.startedAt = partial.startedAt; }
    if (partial.expiresAt !== undefined) { prismaUpdates.expiresAt = partial.expiresAt; }
    if (partial.lastAccess !== undefined) { prismaUpdates.lastAccess = partial.lastAccess; }
    if (partial.revokedAt !== undefined) { prismaUpdates.revokedAt = partial.revokedAt; }
    if (partial.metadata !== undefined) { prismaUpdates.metadata = toUserSessionMetadataInput(partial.metadata); }
    await this.update(existing.id, prismaUpdates);
  }

  async getUserSession(tenantId: string, sessionId: string): Promise<DomainUserSession | null> {
    return this.findBySessionId(sessionId);
  }

  async getUserSessionsByUser(tenantId: string, userId: string): Promise<DomainUserSession[]> {
    return this.findByUser(userId);
  }

  async getUserSessionsByOrganization(tenantId: string, filters?: { status?: PrismaSessionStatus | PrismaSessionStatus[]; userId?: string; ipAddress?: string; }): Promise<DomainUserSession[]> {
    const whereClause: Prisma.UserSessionWhereInput = {};
    if (filters?.status) {
      whereClause.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
    }
    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }
    if (filters?.ipAddress) {
      whereClause.ipAddress = { contains: filters.ipAddress, mode: 'insensitive' };
    }

    const records = await this.prisma.userSession.findMany({ where: { ...whereClause, user: { memberships: { some: { orgId: tenantId } } } } });
    return records.map(mapPrismaUserSessionToDomain);
  }

  async invalidateUserSession(tenantId: string, sessionId: string): Promise<void> {
    const session = await this.findBySessionId(sessionId);
    if (!session) { return; }
    await this.revokeSession(session.id);
  }

  async invalidateUserSessionsByUser(tenantId: string, userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({ where: { userId, user: { memberships: { some: { orgId: tenantId } } } }, data: { status: SessionStatus.revoked, revokedAt: new Date() } });
  }

  async cleanupExpiredSessions(_tenantId: string): Promise<number> {
    void _tenantId;
    // Tenant-scoped cleanup currently deletes expired sessions regardless of tenant
    return this.cleanupExpiredSessionsInternal();
  }
}
