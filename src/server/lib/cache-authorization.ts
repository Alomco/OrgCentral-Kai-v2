const CACHE_SAFE_CORRELATION_ID = '00000000-0000-0000-0000-000000000000';

export function toCacheSafeAuthorizationContext<T extends { correlationId: string }>(
    authorization: T,
): T {
    if (authorization.correlationId === CACHE_SAFE_CORRELATION_ID) {
        return authorization;
    }

    return {
        ...authorization,
        correlationId: CACHE_SAFE_CORRELATION_ID,
    };
}
