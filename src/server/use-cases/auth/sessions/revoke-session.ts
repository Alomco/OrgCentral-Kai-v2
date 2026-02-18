import { auth } from '@/server/lib/auth';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { SessionAccessRequest } from '@/server/security/authorization';
import { normalizeHeaders, assertNonEmpty } from '@/server/use-cases/shared';
import { getSessionContext, type GetSessionDependencies } from './get-session';

export type RevokeSessionDependencies = GetSessionDependencies;

export interface RevokeSessionInput extends SessionAccessRequest {
    headers: Headers | HeadersInit;
    /** Session token (Better Auth session identifier) to revoke. */
    sessionToken: string;
    disableCookieCache?: boolean;
    disableRefresh?: boolean;
    actorIpAddress?: string;
    actorUserAgent?: string;
}

export interface RevokeSessionResult {
    success: true;
    authorization: RepositoryAuthorizationContext;
}

export async function revokeSession(
    deps: RevokeSessionDependencies,
    input: RevokeSessionInput,
): Promise<RevokeSessionResult> {
    assertNonEmpty(input.sessionToken, 'Session token');

    const { authorization } = await getSessionContext(deps, {
        headers: input.headers,
        orgId: input.orgId,
        requiredPermissions: input.requiredPermissions ?? { organization: ['read'] },
        requiredAnyPermissions: input.requiredAnyPermissions,
        expectedClassification: input.expectedClassification,
        expectedResidency: input.expectedResidency,
        auditSource: input.auditSource ?? 'session-revocation',
        correlationId: input.correlationId,
        action: input.action ?? 'revoke',
        resourceType: input.resourceType ?? 'session',
        resourceAttributes: input.resourceAttributes,
        disableCookieCache: input.disableCookieCache ?? true,
        disableRefresh: input.disableRefresh ?? true,
        ipAddress: input.actorIpAddress,
        userAgent: input.actorUserAgent,
    });

    const headers = normalizeHeaders(input.headers);
    await auth.api.revokeSession({
        headers,
        body: { token: input.sessionToken },
    });

    await deps.userSessionRepository?.invalidateUserSession(authorization.orgId, input.sessionToken);

    return {
        success: true,
        authorization,
    };
}
