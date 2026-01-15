import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { normalizeHeaders } from '@/server/use-cases/shared/normalizers';

export interface RequestSecurityContext {
    ipAddress?: string;
    userAgent?: string;
    securityContext?: Record<string, unknown>;
}

function extractFirstHeaderValue(headers: Headers, name: string): string | undefined {
    const raw = headers.get(name);
    if (!raw) {
        return undefined;
    }
    const [first] = raw.split(',');
    const trimmed = first.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function extractIpAddress(headers: Headers | HeadersInit): string | undefined {
    const normalized = normalizeHeaders(headers);
    return (
        extractFirstHeaderValue(normalized, 'x-forwarded-for') ??
        extractFirstHeaderValue(normalized, 'x-real-ip')
    );
}

export function extractUserAgent(headers: Headers | HeadersInit): string | undefined {
    const normalized = normalizeHeaders(headers);
    const value = normalized.get('user-agent');
    return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function buildInvitationRequestSecurityContext(params: {
    authorization: RepositoryAuthorizationContext;
    headers: Headers | HeadersInit;
    action: string;
    targetEmail?: string;
}): RequestSecurityContext {
    const ipAddress = extractIpAddress(params.headers);
    const userAgent = extractUserAgent(params.headers);

    const securityContext: Record<string, unknown> = {
        orgId: params.authorization.orgId,
        userId: params.authorization.userId,
        roleKey: params.authorization.roleKey,
        roles: params.authorization.roles,
        auditSource: params.authorization.auditSource,
        correlationId: params.authorization.correlationId,
        dataResidency: params.authorization.dataResidency,
        dataClassification: params.authorization.dataClassification,
        action: params.action,
        targetEmail: params.targetEmail,
        ipAddress,
        userAgent,
    };

    return {
        ipAddress,
        userAgent,
        securityContext,
    } satisfies RequestSecurityContext;
}
