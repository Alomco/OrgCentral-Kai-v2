interface RateLimitState {
    count: number;
    resetAt: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

const adminRateLimitCache = new Map<string, RateLimitState>();

export function checkAdminRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number,
): RateLimitResult {
    const now = Date.now();
    const existing = adminRateLimitCache.get(key);

    if (!existing || existing.resetAt <= now) {
        const state: RateLimitState = { count: 1, resetAt: now + windowMs };
        adminRateLimitCache.set(key, state);
        return {
            allowed: true,
            remaining: Math.max(0, maxRequests - 1),
            resetAt: state.resetAt,
        };
    }

    if (existing.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    adminRateLimitCache.set(key, existing);

    return {
        allowed: true,
        remaining: Math.max(0, maxRequests - existing.count),
        resetAt: existing.resetAt,
    };
}

export function buildAdminRateLimitKey(input: {
    orgId: string;
    userId: string;
    action: string;
}): string {
    return `${input.orgId}:${input.userId}:${input.action}`;
}
