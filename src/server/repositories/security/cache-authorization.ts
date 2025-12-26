import type { RepositoryAuthorizationContext } from './repository-authorization';

const CACHE_SAFE_CORRELATION_ID = '00000000-0000-0000-0000-000000000000';

export function toCacheSafeAuthorizationContext(
    authorization: RepositoryAuthorizationContext,
): RepositoryAuthorizationContext {
    if (authorization.correlationId === CACHE_SAFE_CORRELATION_ID) {
        return authorization;
    }

    return {
        ...authorization,
        correlationId: CACHE_SAFE_CORRELATION_ID,
    };
}
