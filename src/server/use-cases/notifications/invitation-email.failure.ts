import type { NotificationDeliveryResult } from '@/server/services/platform/notifications/notification-types';

export function getInvitationDeliveryFailureMessage(delivery: NotificationDeliveryResult): string {
    const providerLabel = delivery.provider ? `provider=${delivery.provider}` : 'provider=unknown';
    const statusLabel = `status=${delivery.status}`;
    const messageId = sanitizeMessageId(delivery.externalId);
    const idLabel = messageId ? `messageId=${messageId}` : null;
    const prefix = ['email', providerLabel, statusLabel, idLabel].filter(Boolean).join(' ');

    if (delivery.status === 'skipped') {
        const sanitizedDetail = sanitizeDeliveryDetail(delivery.detail);
        const detail = sanitizedDetail.length > 0 ? sanitizedDetail : 'Email delivery is not configured.';
        return `${prefix}: ${detail}`;
    }

    if (delivery.status !== 'failed') {
        const sanitizedDetail = sanitizeDeliveryDetail(delivery.detail);
        return sanitizedDetail.length > 0
            ? `${prefix}: ${sanitizedDetail}`
            : `${prefix}: Invitation email delivery did not complete.`;
    }

    const sanitizedDetail = sanitizeDeliveryDetail(delivery.detail);
    const message = mapKnownFailureMessage(sanitizedDetail);
    if (message) {
        return `${prefix}: ${message}`;
    }

    return sanitizedDetail.length > 0
        ? `${prefix}: Invitation email delivery failed: ${sanitizedDetail}`
        : `${prefix}: Invitation email delivery failed.`;
}

function sanitizeDeliveryDetail(detail: string | undefined): string {
    if (!detail) {
        return '';
    }

    const redacted = detail
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted email]')
        .replace(/https?:\/\/\S+/gi, '[redacted url]')
        .replace(/token=([^&\s]+)/gi, 'token=[redacted]')
        .replace(/\b(bearer|authorization|api[-_ ]?key)\b\s*[:=]?\s*[^\s]+/gi, '$1=[redacted]')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const MAX_LEN = 180;
    return redacted.length > MAX_LEN ? `${redacted.slice(0, MAX_LEN - 3)}...` : redacted;
}

function sanitizeMessageId(externalId: string | undefined): string {
    if (!externalId) {
        return '';
    }

    const normalized = externalId.replace(/[\r\n\t]+/g, ' ').trim();
    const MAX_LEN = 80;
    return normalized.length > MAX_LEN ? `${normalized.slice(0, MAX_LEN - 3)}...` : normalized;
}

function mapKnownFailureMessage(sanitizedDetail: string): string | null {
    if (!sanitizedDetail) {
        return null;
    }

    const detail = sanitizedDetail.toLowerCase();

    if (
        detail.includes('unauthorized') ||
        detail.includes('forbidden') ||
        detail.includes('invalid api key') ||
        (detail.includes('api') && detail.includes('key')) ||
        detail.includes('401')
    ) {
        return 'Invitation email delivery failed: email service authentication is misconfigured.';
    }

    if (
        detail.includes('rate limit') ||
        detail.includes('too many requests') ||
        detail.includes('429')
    ) {
        return 'Invitation email delivery failed: provider rate-limited the request (HTTP 429).';
    }

    if (
        (detail.includes('domain') && detail.includes('verify')) ||
        detail.includes('domain not verified')
    ) {
        return 'Invitation email delivery failed: sending domain is not verified with the email provider.';
    }

    if (
        (detail.includes('from') && (detail.includes('not allowed') || detail.includes('not authorized'))) ||
        detail.includes('sender address not verified')
    ) {
        return 'Invitation email delivery failed: sender address is not authorized with the email provider.';
    }

    if (
        detail.includes('suppression') ||
        detail.includes('suppressed') ||
        detail.includes('bounced')
    ) {
        return 'Invitation email delivery failed: recipient address is suppressed/bounced by the email provider.';
    }

    if (
        detail.includes('invalid recipient') ||
        detail.includes('invalid address') ||
        detail.includes('mailbox unavailable') ||
        detail.includes('5.1.1')
    ) {
        return 'Invitation email delivery failed: recipient address appears invalid or unavailable.';
    }

    if (
        detail.includes('timeout') ||
        detail.includes('timed out') ||
        detail.includes('econn') ||
        detail.includes('network')
    ) {
        return 'Invitation email delivery failed: provider/network error (timeout/connection failure).';
    }

    return null;
}
