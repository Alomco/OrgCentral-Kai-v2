import { Novu } from '@novu/node';
import { appLogger } from '@/server/logging/structured-logger';
import type {
  NotificationChannel,
  NotificationDeliveryAdapter,
  NotificationDeliveryPayload,
  NotificationDeliveryResult,
} from '../notification-types';

interface NovuClient {
  trigger(
    workflowId: string,
    input: {
      to: { subscriberId: string; email?: string; phone?: string };
      payload: Record<string, unknown>;
    },
  ): Promise<{ acknowledged?: boolean; transactionId?: string }>;
}

export interface NovuAdapterOptions {
  apiKey?: string;
  workflowId: string;
  channel?: NotificationChannel;
  client?: NovuClient;
}

type NovuInstance = InstanceType<typeof Novu>;
type NovuTriggerInput = Parameters<NovuInstance['trigger']>[1];
type NovuTriggerResponse = Awaited<ReturnType<NovuInstance['trigger']>>;
interface NovuNormalizedResponse {
  acknowledged?: boolean;
  transactionId?: string;
}

function createNovuClient(apiKey?: string): NovuClient | undefined {
  if (!apiKey) {
    return undefined;
  }
  const novu = new Novu(apiKey);
  return {
    async trigger(workflowId, input) {
      const response = await novu.trigger(workflowId, input as NovuTriggerInput);
      const normalized = normalizeNovuResponse(response);
      return normalized;
    },
  } satisfies NovuClient;
}

function normalizeNovuResponse(response: NovuTriggerResponse): NovuNormalizedResponse {
  return coerceNovuResponse(response);
}

function coerceNovuResponse(response: unknown): NovuNormalizedResponse {
  if (!isRecord(response)) {
    return {};
  }

  const directAck = isBoolean(response.acknowledged)
    ? response.acknowledged
    : isRecord(response.data) && isBoolean(response.data.acknowledged)
      ? response.data.acknowledged
      : undefined;

  const directTransactionId = isString(response.transactionId)
    ? response.transactionId
    : isRecord(response.data) && isString(response.data.transactionId)
      ? response.data.transactionId
      : undefined;

  return {
    acknowledged: directAck,
    transactionId: directTransactionId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export class NovuNotificationAdapter implements NotificationDeliveryAdapter {
  readonly provider = 'novu';
  readonly channel: NotificationChannel;
  private readonly workflowId: string;
  private readonly client?: NovuClient;

  constructor(options: NovuAdapterOptions) {
    this.channel = options.channel ?? 'IN_APP';
    this.workflowId = options.workflowId;
    this.client = options.client ?? createNovuClient(options.apiKey);
  }

  async send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult> {
    if (!this.client || !this.workflowId) {
      return {
        provider: this.provider,
        channel: this.channel,
        status: 'skipped',
        detail: 'Novu client not configured',
      };
    }

    try {
      const response = await this.client.trigger(this.workflowId, {
        to: { subscriberId: payload.userId, email: payload.to },
        payload: {
          title: payload.subject,
          body: payload.body,
          actionUrl: payload.actionUrl,
          orgId: payload.orgId,
        },
      });

      return {
        provider: this.provider,
        channel: this.channel,
        status: response.acknowledged === false ? 'queued' : 'sent',
        externalId: response.transactionId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Novu delivery failed';
      appLogger.error(message, { provider: this.provider });
      return { provider: this.provider, channel: this.channel, status: 'failed', detail: message };
    }
  }
}
