import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IHRNotificationRepository } from '@/server/repositories/contracts/hr/notifications/hr-notification-repository-contract';
import {
    mapDomainHRNotificationToPrismaCreate,
    mapPrismaHRNotificationToDomain,
    toPrismaHRNotificationPriority,
    toPrismaHRNotificationType,
} from '@/server/repositories/mappers/hr/notifications/hr-notification-mapper';
import type {
    HRNotificationCreateDTO,
    HRNotificationDTO,
    HRNotificationListFilters,
} from '@/server/types/hr/notifications';
import type { Prisma, HRNotification, DataClassificationLevel, DataResidencyZone, $Enums } from '@prisma/client';
import { AuthorizationError } from '@/server/errors';
import { invalidateHrNotifications, registerHrNotificationTag } from '@/server/lib/cache-tags/hr-notifications';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

const toPrismaNotificationTypes = (
    types?: HRNotificationListFilters['types'],
): $Enums.HRNotificationType[] | undefined => {
    if (!types?.length) {
        return undefined;
    }
    return types.map((type) => toPrismaHRNotificationType(type));
};

const toPrismaNotificationPriorities = (
    priorities?: HRNotificationListFilters['priorities'],
): $Enums.NotificationPriority[] | undefined => {
    if (!priorities?.length) {
        return undefined;
    }
    return priorities.map((priority) => toPrismaHRNotificationPriority(priority));
};

export class PrismaHRNotificationRepository extends BasePrismaRepository implements IHRNotificationRepository {
    async createNotification(context: RepositoryAuthorizationContext | string, input: HRNotificationCreateDTO): Promise<HRNotificationDTO> {
        const authorization = this.normalizeAuthorizationContext(context, 'hr_notification');
        if (input.orgId !== authorization.orgId) {
            throw new AuthorizationError('Cross-tenant notification creation mismatch', { orgId: authorization.orgId });
        }
        this.validateTenantWriteAccess(authorization, authorization.orgId, 'write');
        this.validatePiiAccess(authorization, 'write', 'hr_notification');
        const isRead = input.isRead ?? false;
        const readAt = input.readAt ?? (isRead ? new Date() : null);
        const data = mapDomainHRNotificationToPrismaCreate({
            ...input,
            isRead,
            readAt,
        });
        const rec = await this.prisma.hRNotification.create({ data });
        this.assertTenantRecord(rec, authorization, 'hr_notification');
        const domain = mapPrismaHRNotificationToDomain(rec);
        await this.invalidateCacheScoped(authorization, rec);
        return domain;
    }

    async markRead(context: RepositoryAuthorizationContext | string, notificationId: string, readAt?: Date): Promise<HRNotificationDTO> {
        const authorization = this.normalizeAuthorizationContext(context, 'hr_notification');
        await this.prisma.hRNotification.updateMany({
            where: { id: notificationId, orgId: authorization.orgId },
            data: { isRead: true, readAt: readAt ?? new Date() },
        });
        const rec = await this.prisma.hRNotification.findFirst({
            where: { id: notificationId, orgId: authorization.orgId },
        });
        const guarded = this.assertTenantRecord(rec, authorization, 'hr_notification');
        const domain = mapPrismaHRNotificationToDomain(guarded);
        await this.invalidateCacheScoped(authorization, guarded);
        return domain;
    }

    async markAllRead(context: RepositoryAuthorizationContext | string, userId: string, before?: Date): Promise<number> {
        const authorization = this.normalizeAuthorizationContext(context, 'hr_notification');
        const res = await this.prisma.hRNotification.updateMany({
            where: { orgId: authorization.orgId, userId, isRead: false, createdAt: before ? { lte: before } : undefined },
            data: { isRead: true, readAt: new Date() },
        });
        const cacheContext = await this.resolveCacheContext(authorization, userId);
        if (cacheContext) {
            await invalidateHrNotifications(cacheContext);
        }
        return res.count;
    }

    async listNotifications(
        context: RepositoryAuthorizationContext | string,
        userId: string,
        filters?: HRNotificationListFilters,
    ): Promise<HRNotificationDTO[]> {
        const authorization = this.normalizeAuthorizationContext(context, 'hr_notification');
        const typeFilter = toPrismaNotificationTypes(filters?.types);
        const priorityFilter = toPrismaNotificationPriorities(filters?.priorities);
        const where: Prisma.HRNotificationWhereInput = {
            orgId: authorization.orgId,
            userId,
            isRead: filters?.unreadOnly ? false : undefined,
            type: typeFilter ? { in: typeFilter } : undefined,
            priority: priorityFilter ? { in: priorityFilter } : undefined,
        };

        if (filters?.since || filters?.until) {
            where.createdAt = {
                gte: filters.since ? new Date(filters.since) : undefined,
                lte: filters.until ? new Date(filters.until) : undefined,
            };
        }

        if (filters?.includeExpired === false) {
            where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
        }

        const recs = await this.prisma.hRNotification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters?.limit,
        });
        if (recs.length) {
            this.registerCacheScoped(authorization, recs[0]);
        }
        return recs.map(mapPrismaHRNotificationToDomain);
    }

    async getUnreadCount(context: RepositoryAuthorizationContext | string, userId: string): Promise<number> {
        const authorization = this.normalizeAuthorizationContext(context, 'hr_notification');
        return this.prisma.hRNotification.count({ where: { orgId: authorization.orgId, userId, isRead: false } });
    }

    async deleteNotification(context: RepositoryAuthorizationContext | string, notificationId: string): Promise<void> {
        const authorization = this.normalizeAuthorizationContext(context, 'hr_notification');
        const rec = await this.prisma.hRNotification.findFirst({
            where: { id: notificationId, orgId: authorization.orgId },
            select: { orgId: true },
        });
        if (!rec) {
            return;
        }
        await this.prisma.hRNotification.deleteMany({ where: { id: notificationId, orgId: authorization.orgId } });
        const cacheContext = await this.resolveCacheContext(authorization);
        if (cacheContext) {
            await invalidateHrNotifications(cacheContext);
        }
    }

    private buildCacheContext(
        record: Pick<HRNotification, 'orgId' | 'dataClassification' | 'residencyTag'>,
    ): { orgId: string; classification: DataClassificationLevel; residency: DataResidencyZone } {
        const { orgId, dataClassification, residencyTag } = record;
        return {
            orgId,
            classification: dataClassification,
            residency: residencyTag,
        };
    }

    private async resolveCacheContext(
        context: RepositoryAuthorizationContext,
        userId?: string,
    ): Promise<{
        orgId: string;
        classification: DataClassificationLevel;
        residency: DataResidencyZone;
    } | null> {
        if (context.dataClassification !== 'OFFICIAL') {
            return null;
        }

        const sample = await this.prisma.hRNotification.findFirst({
            where: { orgId: context.orgId, userId },
            select: { dataClassification: true, residencyTag: true },
        });

        return {
            orgId: context.orgId,
            classification: sample?.dataClassification ?? context.dataClassification,
            residency: sample?.residencyTag ?? context.dataResidency,
        };
    }

    private registerCacheScoped(context: RepositoryAuthorizationContext, record: HRNotification): void {
        if (context.dataClassification !== 'OFFICIAL') {
            return;
        }
        registerHrNotificationTag(this.buildCacheContext(record));
    }

    private async invalidateCacheScoped(
        context: RepositoryAuthorizationContext,
        record: Pick<HRNotification, 'orgId' | 'dataClassification' | 'residencyTag'>,
    ): Promise<void> {
        if (context.dataClassification !== 'OFFICIAL') {
            return;
        }
        await invalidateHrNotifications(this.buildCacheContext(record));
    }
}
