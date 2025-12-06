import type { ResultAsync } from 'neverthrow';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type {
    NotificationCreateInput,
    NotificationEnvelope,
    NotificationListFilters,
    NotificationRecord,
} from '@/server/repositories/notifications/notification-schemas';

export interface NotificationAuditWriter {
    write: (envelope: NotificationEnvelope) => Promise<void>;
}

export interface INotificationRepository {
    createNotification(
        authorization: RepositoryAuthorizationContext,
        input: NotificationCreateInput,
    ): ResultAsync<NotificationRecord, Error>;
    markRead(
        authorization: RepositoryAuthorizationContext,
        notificationId: string,
        readAt?: Date,
    ): ResultAsync<NotificationRecord, Error>;
    markAllRead(
        authorization: RepositoryAuthorizationContext,
        userId: string,
        before?: Date,
    ): ResultAsync<number, Error>;
    listNotifications(
        authorization: RepositoryAuthorizationContext,
        userId: string,
        filters?: NotificationListFilters,
    ): ResultAsync<NotificationRecord[], Error>;
    deleteNotification(
        authorization: RepositoryAuthorizationContext,
        notificationId: string,
    ): ResultAsync<void, Error>;
}
