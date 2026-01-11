import { appLogger } from '@/server/logging/structured-logger';
import type {
    NotificationDeliveryAdapter,
    NotificationDeliveryPayload,
    NotificationDeliveryResult,
} from '@/server/services/platform/notifications/notification-types';
import {
    SenderXEmailProvider,
    type SenderXEmailProviderOptions,
} from '@/server/services/notifications/providers/senderx-email-provider';

export type SenderXNotificationAdapterOptions = SenderXEmailProviderOptions;

export class SenderXNotificationAdapter implements NotificationDeliveryAdapter {
    readonly provider = 'senderx';
    readonly channel = 'EMAIL';
    private readonly emailProvider: SenderXEmailProvider;

    constructor(options: SenderXNotificationAdapterOptions = {}) {
        this.emailProvider = new SenderXEmailProvider(options);
    }

    async send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult> {
        try {
            const html = this.buildHtml(payload);
            const result = await this.emailProvider.sendEmail({
                to: payload.to,
                subject: payload.subject,
                content: html,
                isHtml: true,
                brandName: undefined,
                from: undefined,
                useTracker: undefined,
                correlationId: payload.correlationId,
            });

            return {
                provider: this.provider,
                channel: this.channel,
                status: result.status,
                detail: result.detail,
                externalId: result.messageId,
            } satisfies NotificationDeliveryResult;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'SenderX delivery failed';
            appLogger.error('notifications.senderx.delivery-error', {
                provider: this.provider,
                orgId: payload.orgId,
                correlationId: payload.correlationId,
                error: message,
            });
            return {
                provider: this.provider,
                channel: this.channel,
                status: 'failed',
                detail: message,
            } satisfies NotificationDeliveryResult;
        }
    }

    private buildHtml(payload: NotificationDeliveryPayload): string {
        const safeBody = payload.body.replace(/\n/g, '<br/>');
        const cta = payload.actionUrl
            ? `<p style="margin-top:16px;"><a href="${payload.actionUrl}" style="padding:10px 14px;background:#111827;color:#ffffff;border-radius:8px;text-decoration:none;">Open</a></p>`
            : '';
        return `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111827;">
      <p>${safeBody}</p>
      ${cta}
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">Notification sent for org ${payload.orgId}</p>
    </div>`;
    }
}
