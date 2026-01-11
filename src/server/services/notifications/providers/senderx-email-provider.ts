import { appLogger } from '@/server/logging/structured-logger';
import type {
    NotificationEmailPayload,
    NotificationEmailProvider,
    NotificationEmailResult,
} from '@/server/services/notifications/email-delivery.types';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export interface SenderXEmailProviderOptions {
    apiKey?: string;
    endpoint?: string;
    defaultBrandName?: string;
    defaultFromAddress?: string;
    useTracker?: boolean;
    fetcher?: Fetcher;
}

interface SenderXResponse {
    code?: number;
    message?: string;
    data?: { messageId?: string; status?: string };
    error?: boolean;
}

export class SenderXEmailProvider implements NotificationEmailProvider {
    private readonly apiKey?: string;
    private readonly endpoint: string;
    private readonly defaultBrandName: string;
    private readonly defaultFromAddress: string;
    private readonly useTracker: boolean;
    private readonly fetcher: Fetcher;

    constructor(options: SenderXEmailProviderOptions = {}) {
        this.apiKey = options.apiKey ?? process.env.SENDERX_API_KEY;
        this.endpoint = options.endpoint ?? process.env.SENDERX_ENDPOINT ?? 'https://api.team71.link/api/v1/public/send-email';
        this.defaultBrandName = options.defaultBrandName ?? process.env.SENDERX_BRAND_NAME ?? 'OrgCentral';
        this.defaultFromAddress = options.defaultFromAddress ??
            process.env.SENDERX_FROM_EMAIL ??
            'OrgCentral <no-reply@orgcentral.test>';
        this.useTracker = options.useTracker ?? (process.env.SENDERX_USE_TRACKER === 'true');
        const runtimeFetch = typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined;
        this.fetcher = options.fetcher ?? runtimeFetch ?? fetchNotAvailable;
    }

    async sendEmail(payload: NotificationEmailPayload): Promise<NotificationEmailResult> {
        if (!this.apiKey) {
            throw new Error('SenderX API key is not configured.');
        }

        const fromAddress = normalizeEmailAddress(payload.from ?? this.defaultFromAddress);
        if (!fromAddress) {
            throw new Error('SenderX from address is invalid. Configure SENDERX_FROM_EMAIL with a valid email address.');
        }

        const requestBody = {
            to: payload.to,
            from: fromAddress,
            subject: payload.subject,
            content: payload.content,
            isHtml: payload.isHtml,
            useTracker: payload.useTracker ?? this.useTracker,
            brandName: payload.brandName ?? this.defaultBrandName,
        } satisfies Record<string, unknown>;

        const response = await this.fetcher(this.endpoint, {
            method: 'POST',
            headers: {
                'api-key': this.apiKey,
                'Content-Type': 'application/json',
                ...(payload.correlationId ? { 'x-correlation-id': payload.correlationId } : {}),
            },
            body: JSON.stringify(requestBody),
        });

        const parsed = await safeParseResponse(response);
        if (!response.ok || parsed?.error) {
            const message = parsed?.message ?? `SenderX responded with status ${String(response.status)}`;
            appLogger.error('notifications.senderx.error', {
                status: response.status,
                message,
            });
            throw new Error(message);
        }

        return {
            messageId: parsed?.data?.messageId,
            status: (parsed?.data?.status as 'sent' | 'queued' | undefined) ?? 'sent',
            detail: parsed?.message,
        } satisfies NotificationEmailResult;
    }
}

async function safeParseResponse(response: Response): Promise<SenderXResponse | undefined> {
    try {
        return (await response.json()) as SenderXResponse;
    } catch (error) {
        appLogger.warn('notifications.senderx.parse-error', {
            status: response.status,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return undefined;
    }
}

function normalizeEmailAddress(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }
    const bracketMatch = /<([^>]+)>/.exec(trimmed);
    const candidate = (bracketMatch ? bracketMatch[1] : trimmed).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        return null;
    }
    return candidate;
}

function fetchNotAvailable(): never {
    throw new Error('Fetch API is not available in this runtime.');
}
