import { Resend } from 'resend';
import { appLogger } from '@/server/logging/structured-logger';
import type {
  NotificationDeliveryAdapter,
  NotificationDeliveryPayload,
  NotificationDeliveryResult,
} from '../notification-types';

interface ResendEmailClient {
  send(input: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    headers?: Record<string, string>;
  }): Promise<{ id?: string }>;
}

export interface ResendAdapterOptions {
  apiKey?: string;
  fromAddress: string;
  client?: { emails: ResendEmailClient };
}

export class ResendNotificationAdapter implements NotificationDeliveryAdapter {
  readonly provider = 'resend';
  readonly channel = 'EMAIL';
  private readonly client?: ResendEmailClient;
  private readonly from: string;

  constructor(options: ResendAdapterOptions) {
    this.from = options.fromAddress;
    if (options.client?.emails) {
      this.client = options.client.emails;
    } else {
      this.client = createResendEmailClient(options.apiKey);
    }
  }

  async send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult> {
    if (!this.client) {
      return {
        provider: this.provider,
        channel: this.channel,
        status: 'skipped',
        detail: 'Resend client not configured',
      };
    }

    try {
      const response = await this.client.send({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: this.buildHtml(payload),
        headers: payload.correlationId ? { 'X-Correlation-Id': payload.correlationId } : undefined,
      });

      return {
        provider: this.provider,
        channel: this.channel,
        status: 'sent',
        externalId: response.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resend delivery failed';
      appLogger.error(message, { provider: this.provider });
      return { provider: this.provider, channel: this.channel, status: 'failed', detail: message };
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

type ResendEmailsClient = InstanceType<typeof Resend>['emails'];
type ResendEmailResult = Awaited<ReturnType<ResendEmailsClient['send']>>;

function createResendEmailClient(apiKey?: string): ResendEmailClient | undefined {
  if (!apiKey) {
    return undefined;
  }
  const emails = new Resend(apiKey).emails;
  return {
    async send(input) {
      const response = await emails.send(input);
      return { id: extractEmailId(response) };
    },
  } satisfies ResendEmailClient;
}

function extractEmailId(response: ResendEmailResult): string | undefined {
  const directId = (response as { id?: string }).id;
  if (typeof directId === 'string') {
    return directId;
  }
  const data = (response as { data?: { id?: string } }).data;
  if (data && typeof data.id === 'string') {
    return data.id;
  }
  return undefined;
}
