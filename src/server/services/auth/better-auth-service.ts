import { toNextJsHandler } from 'better-auth/next-js';
import type { NextRequest } from 'next/server';
import { createAuth } from '@/server/lib/auth';

export interface BetterAuthService {
    handle(request: NextRequest): Promise<Response>;
}

interface BetterAuthServiceOptions {
    baseURL?: string;
    trustProxyHeaders?: boolean;
    maxCachedAuthHandlers?: number;
}

function resolveBaseURLFromRequest(request: NextRequest, trustProxyHeaders: boolean): string {
    if (trustProxyHeaders) {
        const forwardedProto = normalizeProtocolHeader(request.headers.get('x-forwarded-proto'));
        const forwardedHost = normalizeHostHeader(request.headers.get('x-forwarded-host'));

        const host = forwardedHost ?? normalizeHostHeader(request.headers.get('host'));
        const proto = forwardedProto ?? normalizeProtocolHeader(request.nextUrl.protocol.replace(':', ''));

        if (host && proto) {
            const resolved = normalizeOrigin(`${proto}://${host}`);
            if (resolved) {
                return resolved;
            }
        }
    }

    return request.nextUrl.origin;
}

export function createBetterAuthService(options: BetterAuthServiceOptions = {}): BetterAuthService {
    const authByBaseURL = new Map<string, ReturnType<typeof createAuth>>();
    const maxCachedAuthHandlers = resolveMaxCachedAuthHandlers(options.maxCachedAuthHandlers);

    const envBaseURL =
        options.baseURL ??
        process.env.AUTH_BASE_URL ??
        undefined;

    const trustProxyHeaders =
        options.trustProxyHeaders ??
        process.env.AUTH_TRUST_PROXY_HEADERS === 'true';

    function getAuthForRequest(request: NextRequest): ReturnType<typeof createAuth> {
        const baseURL = envBaseURL ?? resolveBaseURLFromRequest(request, trustProxyHeaders);

        const cached = authByBaseURL.get(baseURL);
        if (cached) {
            return cached;
        }

        pruneOldestAuthHandlers(authByBaseURL, maxCachedAuthHandlers);

        const created = createAuth(baseURL);
        authByBaseURL.set(baseURL, created);
        return created;
    }

    return {
        async handle(request) {
            const auth = getAuthForRequest(request);
            const handler = toNextJsHandler(auth.handler);

            if (request.method === 'GET') {
                return handler.GET(request);
            }

            if (request.method === 'POST') {
                return handler.POST(request);
            }

            return new Response(null, { status: 405 });
        },
    } satisfies BetterAuthService;
}

const sharedService = createBetterAuthService();

export function getBetterAuthService(): BetterAuthService {
    return sharedService;
}

function resolveMaxCachedAuthHandlers(value?: number): number {
    if (!Number.isFinite(value) || typeof value !== 'number' || value <= 0) {
        return 16;
    }
    return Math.max(1, Math.floor(value));
}

function pruneOldestAuthHandlers(
    authByBaseURL: Map<string, ReturnType<typeof createAuth>>,
    maxCachedAuthHandlers: number,
): void {
    while (authByBaseURL.size >= maxCachedAuthHandlers) {
        const oldest = authByBaseURL.keys().next().value;
        if (!oldest) {
            break;
        }
        authByBaseURL.delete(oldest);
    }
}

function normalizeOrigin(value: string): string | null {
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

function normalizeProtocolHeader(value: string | null): 'http' | 'https' | null {
    const normalized = value?.trim().toLowerCase();
    if (normalized === 'http' || normalized === 'https') {
        return normalized;
    }
    return null;
}
