import type { QueueJobOptions } from '@/server/types/queueing';
import type { NotificationDispatchPayload, JsonValue } from '@/server/types/notification-dispatch';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export interface NotificationDispatchMetadata {
    correlationId?: string;
    cacheScopes?: string[];
    attributes?: Record<string, JsonValue>;
}

export interface NotificationDispatchInput {
    authorization: RepositoryAuthorizationContext;
    notification: NotificationDispatchPayload;
    metadata?: NotificationDispatchMetadata;
    jobOptions?: QueueJobOptions;
}

export interface NotificationSendInput {
    authorization: RepositoryAuthorizationContext;
    notification: NotificationDispatchPayload;
    jobId?: string | number | null;
}

export interface NotificationDispatchContract {
    dispatchNotification(input: NotificationDispatchInput): Promise<void>;
}

export interface NotificationDeliveryContract {
    sendNotification(input: NotificationSendInput): Promise<void>;
}

export type NotificationServiceContract = NotificationDispatchContract & NotificationDeliveryContract;
