import type { JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { WorkerJobMetadata } from '@/server/workers/abstract-org-worker';
import {
    NOTIFICATION_DISPATCH_JOB_NAME,
    type NotificationDispatchEnvelope,
} from '@/server/workers/notifications/dispatch.types';
import type { NotificationDispatchPayload } from '@/server/types/notification-dispatch';
import {
    getNotificationDispatchQueueClient,
    type NotificationDispatchQueueClient,
} from '@/server/workers/notifications/dispatch.queue';
import type { NotificationTemplateResolver } from '@/server/services/notifications/templates/notification-template-registry';
import { defaultNotificationTemplateResolver } from '@/server/services/notifications/templates/notification-template-registry';
import type { NotificationEmailProvider } from '@/server/services/notifications/email-delivery.types';
import { SenderXEmailProvider } from '@/server/services/notifications/providers/senderx-email-provider';

export interface DispatchNotificationInput {
    authorization: RepositoryAuthorizationContext;
    notification: NotificationDispatchPayload;
    metadata?: WorkerJobMetadata;
    jobOptions?: JobsOptions;
}

export interface SendNotificationInput {
    authorization: RepositoryAuthorizationContext;
    notification: NotificationDispatchPayload;
    jobId?: string | number | null;
}

export interface NotificationServiceDependencies {
    queueClient?: NotificationDispatchQueueClient;
    templateResolver?: NotificationTemplateResolver;
    emailProvider?: NotificationEmailProvider;
}

export class NotificationService extends AbstractBaseService {
    private readonly queueClient: NotificationDispatchQueueClient;
    private readonly templateResolver: NotificationTemplateResolver;
    private readonly emailProvider: NotificationEmailProvider;

    constructor(dependencies: NotificationServiceDependencies = {}) {
        super();
        this.queueClient = dependencies.queueClient ?? getNotificationDispatchQueueClient();
        this.templateResolver = dependencies.templateResolver ?? defaultNotificationTemplateResolver;
        this.emailProvider = dependencies.emailProvider ?? new SenderXEmailProvider();
    }

    async dispatchNotification(input: DispatchNotificationInput): Promise<void> {
        const envelope: NotificationDispatchEnvelope = {
            orgId: input.authorization.orgId,
            payload: input.notification,
            authorization: {
                userId: input.authorization.userId,
                auditSource: input.authorization.auditSource,
                correlationId: input.metadata?.correlationId ?? input.authorization.correlationId,
                expectedClassification: input.authorization.dataClassification,
                expectedResidency: input.authorization.dataResidency,
            },
            metadata: {
                correlationId: input.metadata?.correlationId ?? input.authorization.correlationId,
                cacheScopes: input.metadata?.cacheScopes,
                attributes: {
                    templateKey: input.notification.templateKey,
                    channel: input.notification.channel,
                    recipientUserId: input.notification.recipient.userId,
                    recipientEmail: input.notification.recipient.email,
                    ...input.metadata?.attributes,
                },
            },
        };

        const context = this.buildContext(input.authorization, {
            metadata: {
                job: NOTIFICATION_DISPATCH_JOB_NAME,
                templateKey: input.notification.templateKey,
                channel: input.notification.channel,
            },
        });

        await this.executeInServiceContext(context, 'notifications.dispatch.enqueue', () =>
            this.queueClient.enqueueDispatchJob(envelope, input.jobOptions),
        );
    }

    async sendNotification(input: SendNotificationInput): Promise<void> {
        const context = this.buildContext(input.authorization, {
            metadata: {
                jobId: input.jobId ?? undefined,
                templateKey: input.notification.templateKey,
                channel: input.notification.channel,
            },
        });

        await this.executeInServiceContext(context, 'notifications.dispatch.send', async () => {
            if (input.notification.channel !== 'EMAIL') {
                this.logger.warn('notifications.dispatch.unsupported-channel', {
                    channel: input.notification.channel,
                    templateKey: input.notification.templateKey,
                });
                return;
            }

            const recipientEmail = input.notification.recipient.email;
            if (!recipientEmail) {
                this.logger.warn('notifications.dispatch.missing-recipient', {
                    channel: input.notification.channel,
                    templateKey: input.notification.templateKey,
                });
                return;
            }

            const rendered = this.templateResolver(input.notification);
            const result = await this.emailProvider.sendEmail({
                to: recipientEmail,
                subject: rendered.subject,
                content: rendered.content,
                isHtml: rendered.isHtml,
                brandName: rendered.brandName,
                from: rendered.from,
                useTracker: rendered.useTracker,
                correlationId: input.authorization.correlationId,
            });

            this.logger.info('notifications.dispatch.email.sent', {
                orgId: input.authorization.orgId,
                jobId: input.jobId,
                templateKey: input.notification.templateKey,
                recipient: recipientEmail,
                providerStatus: result.status,
                providerMessageId: result.messageId,
            });
        });
    }

    private buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId ?? authorization.correlationId,
            metadata: options?.metadata,
        };
    }
}
