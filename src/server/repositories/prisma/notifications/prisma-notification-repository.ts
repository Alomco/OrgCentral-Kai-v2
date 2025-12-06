import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import type { PrismaClient, NotificationMessage, Prisma } from '@prisma/client';
import { BasePrismaRepository, type BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';
import type {
    INotificationRepository,
    NotificationAuditWriter,
} from '@/server/repositories/contracts/notifications';
import type {
    NotificationCreateInput,
    NotificationListFilters,
    NotificationRecord,
} from '@/server/repositories/notifications/notification-schemas';
import { notificationEnvelopeSchema } from '@/server/repositories/notifications/notification-schemas';
import {
    invalidateNotificationCache,
    registerNotificationCache,
    type NotificationCacheContext,
} from '@/server/repositories/notifications/notification-cache';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    buildCacheContext,
    mapPrioritiesToPrisma,
    mapTopicsToPrisma,
    normalizeCreateInput,
    parseNotificationFilters,
    toDomain,
    toPrismaCreate,
} from './prisma-notification-utils';
import { RepositoryAuthorizationError } from '@/server/repositories/security/repository-errors';

const toRepositoryError = (error: unknown): Error =>
    error instanceof Error ? error : new Error('Notification repository failure');

export interface PrismaNotificationRepositoryOptions extends BasePrismaRepositoryOptions {
    auditWriter?: NotificationAuditWriter;
    prisma?: PrismaClient;
}

export class PrismaNotificationRepository
    extends BasePrismaRepository
    implements INotificationRepository {
    private readonly auditWriter?: NotificationAuditWriter;

    constructor(options?: PrismaNotificationRepositoryOptions) {
        super(options ?? {});
        this.auditWriter = options?.auditWriter;
    }

    createNotification(
        authorization: RepositoryAuthorizationContext,
        input: NotificationCreateInput,
    ): ResultAsync<NotificationRecord, Error> {
        const normalized = normalizeCreateInput(authorization, input);
        if (normalized.isErr()) {
            return errAsync(normalized.error);
        }

        return ResultAsync.fromPromise(
            this.prisma.notificationMessage.create({ data: toPrismaCreate(normalized.value) }),
            toRepositoryError,
        )
            .map(toDomain)
            .andThen((record) => this.afterWrite(record, authorization, 'created'));
    }

    markRead(
        authorization: RepositoryAuthorizationContext,
        notificationId: string,
        readAt?: Date,
    ): ResultAsync<NotificationRecord, Error> {
        return ResultAsync.fromPromise(
            this.prisma.notificationMessage.update({
                where: { id: notificationId },
                data: { isRead: true, readAt: readAt ?? new Date() },
            }),
            toRepositoryError,
        )
            .andThen((record) => this.guardTenant(record, authorization))
            .map(toDomain)
            .andThen((record) => this.afterWrite(record, authorization, 'read'));
    }

    markAllRead(
        authorization: RepositoryAuthorizationContext,
        userId: string,
        before?: Date,
    ): ResultAsync<number, Error> {
        const cutoff = before ? new Date(before) : undefined;
        return ResultAsync.fromPromise(
            this.prisma.notificationMessage.updateMany({
                where: {
                    orgId: authorization.orgId,
                    userId,
                    isRead: false,
                    createdAt: cutoff ? { lte: cutoff } : undefined,
                },
                data: { isRead: true, readAt: new Date() },
            }),
            toRepositoryError,
        ).andThen((result) =>
            this.resolveCacheContext(authorization, userId).andThen((cacheContext) =>
                ResultAsync.fromPromise(
                    invalidateNotificationCache(cacheContext).then(() => result.count),
                    toRepositoryError,
                ),
            ),
        );
    }

    listNotifications(
        authorization: RepositoryAuthorizationContext,
        userId: string,
        filters?: NotificationListFilters,
    ): ResultAsync<NotificationRecord[], Error> {
        const parsedFilters = parseNotificationFilters(filters);
        if (parsedFilters.isErr()) {
            return errAsync(parsedFilters.error);
        }

        const topicFilters = mapTopicsToPrisma(parsedFilters.value.topics);
        const priorityFilters = mapPrioritiesToPrisma(parsedFilters.value.priorities);

        const where: Prisma.NotificationMessageWhereInput = {
            orgId: authorization.orgId,
            userId,
            isRead: parsedFilters.value.unreadOnly ? false : undefined,
            topic: topicFilters ? { in: topicFilters } : undefined,
            priority: priorityFilters ? { in: priorityFilters } : undefined,
            createdAt:
                parsedFilters.value.since || parsedFilters.value.until
                    ? { gte: parsedFilters.value.since, lte: parsedFilters.value.until }
                    : undefined,
            OR:
                parsedFilters.value.includeExpired === false
                    ? [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                    : undefined,
        };

        return ResultAsync.fromPromise(
            this.prisma.notificationMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parsedFilters.value.limit,
            }),
            toRepositoryError,
        ).map((records) => {
            if (records.length > 0) {
                registerNotificationCache(buildCacheContext(records[0]));
            }
            return records.map(toDomain);
        });
    }

    deleteNotification(
        authorization: RepositoryAuthorizationContext,
        notificationId: string,
    ): ResultAsync<void, Error> {
        return ResultAsync.fromPromise(
            this.prisma.notificationMessage.findUnique({ where: { id: notificationId } }),
            toRepositoryError,
        )
            .andThen((record) => this.guardTenant(record, authorization))
            .andThen((record) =>
                ResultAsync.fromPromise(
                    this.prisma.notificationMessage.delete({ where: { id: record.id } }),
                    toRepositoryError,
                ).map(() => toDomain(record)),
            )
            .andThen((record) => this.afterWrite(record, authorization, 'deleted').map(() => undefined));
    }

    private afterWrite(
        record: NotificationRecord,
        authorization: RepositoryAuthorizationContext,
        action: 'created' | 'read' | 'deleted',
    ): ResultAsync<NotificationRecord, Error> {
        const cacheContext = buildCacheContext(record);
        const cachePromise = invalidateNotificationCache(cacheContext);
        const auditPromise = this.auditWriter
            ? this.auditWriter.write(
                  notificationEnvelopeSchema.parse({
                      notificationId: record.id,
                      orgId: record.orgId,
                      userId: record.userId,
                      retentionPolicyId: record.retentionPolicyId,
                      dataClassification: record.dataClassification,
                      residencyTag: record.residencyTag,
                      payload: record,
                      auditMetadata: {
                          createdByUserId: authorization.userId,
                          auditSource: authorization.auditSource,
                          correlationId: authorization.correlationId,
                          auditBatchId: authorization.auditBatchId,
                          action,
                      },
                      createdAt: new Date(),
                  }),
              )
            : Promise.resolve();

        return ResultAsync.fromPromise(
            Promise.all([cachePromise, auditPromise]).then(() => record),
            toRepositoryError,
        );
    }

    private guardTenant(
        record: NotificationMessage | null,
        authorization: RepositoryAuthorizationContext,
    ) {
        if (!record) {
            return errAsync(new RepositoryAuthorizationError('Record not found'));
        }
        if (record.orgId !== authorization.orgId) {
            return errAsync(new RepositoryAuthorizationError('Cross-tenant access denied'));
        }
        return okAsync(record);
    }

    private resolveCacheContext(
        authorization: RepositoryAuthorizationContext,
        userId?: string,
    ): ResultAsync<NotificationCacheContext, Error> {
        return ResultAsync.fromPromise(
            this.prisma.notificationMessage.findFirst({
                where: { orgId: authorization.orgId, userId },
                select: { dataClassification: true, residencyTag: true },
            }),
            toRepositoryError,
        ).map((record) => ({
            orgId: authorization.orgId,
            classification: record?.dataClassification ?? authorization.dataClassification,
            residency: record?.residencyTag ?? authorization.dataResidency,
        }));
    }
}
