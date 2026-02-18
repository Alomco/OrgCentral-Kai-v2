import { randomUUID } from 'node:crypto';
import { APIError } from 'better-auth';
import type { LoginActionResult, LoginFieldErrors } from '@/features/auth/login/login-contracts';
import { resolveAuthBaseURL } from '@/server/lib/auth-environment';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { organizationToTenantScope } from '@/server/security/guards';
import type { OrganizationData } from '@/server/types/leave-types';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';

interface ServiceContextInput {
    organization: OrganizationData;
    requestHeaders: Headers;
}

type LoginServiceFailureResult = Extract<LoginActionResult, { ok: false }>;

export function buildServiceContext(input: ServiceContextInput): ServiceExecutionContext {
    const tenantScope = organizationToTenantScope(input.organization);

    const correlationId = input.requestHeaders.get('x-correlation-id') ?? randomUUID();

    const authorization: RepositoryAuthorizationContext = {
        orgId: tenantScope.orgId,
        userId: 'anonymous',
        roleKey: 'custom',
        permissions: {},
        dataResidency: tenantScope.dataResidency,
        dataClassification: tenantScope.dataClassification,
        auditSource: tenantScope.auditSource,
        auditBatchId: tenantScope.auditBatchId,
        correlationId,
        tenantScope,
    };

    return {
        authorization,
        correlationId,
        metadata: {
            orgSlug: input.organization.slug,
            residency: tenantScope.dataResidency,
            classification: tenantScope.dataClassification,
        },
    } satisfies ServiceExecutionContext;
}

export function normalizeAuthError(error: unknown): LoginServiceFailureResult {
    if (error instanceof APIError) {
        const message = error.body?.message ?? 'We could not sign you in with those credentials.';
        const fieldErrors = coerceFieldErrors(error.body?.errors);
        return {
            ok: false,
            code: error.body?.code ?? 'AUTH_ERROR',
            message,
            fieldErrors,
        } satisfies LoginActionResult;
    }

    return {
        ok: false,
        code: 'UNKNOWN',
        message: 'An unexpected error occurred while signing you in.',
    } satisfies LoginActionResult;
}

export function isOrganizationData(value: unknown): value is OrganizationData {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Partial<OrganizationData>;
    return (
        typeof candidate.id === 'string' &&
        typeof candidate.slug === 'string' &&
        typeof candidate.dataResidency === 'string' &&
        typeof candidate.dataClassification === 'string'
    );
}

export function buildPostLoginCallbackUrl(headers: Headers, orgSlug: string): string {
    const origin = resolveRequestOrigin(headers) ?? resolveAuthBaseURL();
    const url = new URL('/api/auth/post-login', origin);
    if (orgSlug.trim().length > 0) {
        url.searchParams.set('org', orgSlug);
    }
    return url.toString();
}

function coerceFieldErrors(value: unknown): LoginFieldErrors | undefined {
    if (!value || typeof value !== 'object') {
        return undefined;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const normalized = entries.reduce<LoginFieldErrors>((accumulator, [field, entry]) => {
        if (typeof entry === 'string') {
            accumulator[field] = entry;
            return accumulator;
        }

        if (Array.isArray(entry)) {
            const firstMessage = entry.find((item): item is string => typeof item === 'string');
            if (firstMessage) {
                accumulator[field] = firstMessage;
            }
            return accumulator;
        }

        if (entry && typeof entry === 'object') {
            const nested = (entry as { _errors?: unknown[] })._errors;
            if (Array.isArray(nested)) {
                const nestedMessage = nested.find((item): item is string => typeof item === 'string');
                if (nestedMessage) {
                    accumulator[field] = nestedMessage;
                }
            }
        }

        return accumulator;
    }, {});

    return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function resolveRequestOrigin(headers: Headers): string | null {
    const origin = normalizeOrigin(headers.get('origin'));
    if (origin) {
        return origin;
    }

    const forwardedHost = normalizeHostHeader(headers.get('x-forwarded-host') ?? headers.get('host'));
    const forwardedProto = normalizeProtocolHeader(headers.get('x-forwarded-proto'));

    if (forwardedHost) {
        return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
    }

    return null;
}

function normalizeOrigin(value: string | null): string | null {
    if (!value) {
        return null;
    }

    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed.origin;
    } catch {
        return null;
    }
}

function normalizeHostHeader(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('@')) {
        return null;
    }

    return trimmed;
}

function normalizeProtocolHeader(value: string | null): 'http' | 'https' {
    const normalized = value?.trim().toLowerCase();
    return normalized === 'http' ? 'http' : 'https';
}
