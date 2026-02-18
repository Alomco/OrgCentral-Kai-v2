import { SessionStatus, type PrismaJsonValue } from '@/server/types/prisma';
import { AuthorizationError } from '@/server/errors';
import type { IAuthSessionRepository } from '@/server/repositories/contracts/auth/sessions/auth-session-repository-contract';
import type { IUserSessionRepository } from '@/server/repositories/contracts/auth/sessions';
import { createAuthSessionRepository } from '@/server/repositories/providers/auth/auth-session-repository-provider';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { SessionAccessRequest } from '@/server/security/authorization';
import { requireSessionAuthorization } from '@/server/security/authorization';
import { auth, type AuthSession } from '@/server/lib/auth';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { buildMetadata as buildJsonMetadata } from '@/server/use-cases/shared';
import { loadOrgSettings } from '@/server/services/org/settings/org-settings-store';
import { getSecurityEventService } from '@/server/services/auth/security-event-service';
import { enforceOrgSessionSecurity } from './session-security';
import { enforceWorkspaceSetupState } from './workspace-setup-state';
import { normalizeHeaders, resolveRequestPathFromHeaders } from './request-path';

export type SessionRepositoryContract = Pick<
    IUserSessionRepository,
    'createUserSession' | 'getUserSession' | 'updateUserSession' | 'invalidateUserSession'
>;

export interface GetSessionDependencies {
    userSessionRepository?: SessionRepositoryContract;
    authSessionRepository?: IAuthSessionRepository;
}

export interface GetSessionInput extends SessionAccessRequest {
    headers: Headers | HeadersInit;
    disableCookieCache?: boolean;
    disableRefresh?: boolean;
    requestPath?: string;
    /** Optional network metadata for audit trail persistence */
    ipAddress?: string;
    userAgent?: string;
}

export interface GetSessionResult {
    session: NonNullable<AuthSession>;
    authorization: RepositoryAuthorizationContext;
}
export async function getSessionContext(
    deps: GetSessionDependencies,
    input: GetSessionInput,
): Promise<GetSessionResult> {
    const headers = normalizeHeaders(input.headers);
    const session = await auth.api.getSession({
        headers,
        query: {
            disableCookieCache: input.disableCookieCache,
            disableRefresh: input.disableRefresh,
        },
    });

    if (!session?.session) {
        throw new AuthorizationError(
            'Unauthenticated request - session not found.',
            { reason: 'unauthenticated' },
        );
    }

    const authorization = await requireSessionAuthorization(session, extractAccessRequest(input));
    const requestPath = input.requestPath ?? resolveRequestPathFromHeaders(headers);
    const orgSettings = await loadOrgSettings(authorization.orgId);
    try {
        enforceOrgSessionSecurity(session, orgSettings, input.ipAddress);
        await enforceWorkspaceSetupState({
            subject: {
                authUserId: session.user.id,
                orgId: authorization.orgId,
                userId: authorization.userId,
                roleKey: authorization.roleKey,
            },
            requestPath,
        });
    } catch (error) {
        await revokeExpiredSession(
            deps.userSessionRepository,
            deps.authSessionRepository,
            authorization.orgId,
            session,
            error,
            input.ipAddress,
            input.userAgent,
        );
        throw error;
    }
    await syncUserSessionRecord(deps.userSessionRepository, authorization.orgId, session, {
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        dataResidency: authorization.dataResidency,
        dataClassification: authorization.dataClassification,
    });

    return { session, authorization };
}
function extractAccessRequest(input: GetSessionInput): SessionAccessRequest {
    return {
        orgId: input.orgId,
        requiredPermissions: input.requiredPermissions,
        requiredAnyPermissions: input.requiredAnyPermissions,
        expectedClassification: input.expectedClassification,
        expectedResidency: input.expectedResidency,
        auditSource: input.auditSource,
        correlationId: input.correlationId,
        action: input.action,
        resourceType: input.resourceType,
        resourceAttributes: input.resourceAttributes,
    };
}
interface SessionMetadataInput {
    ipAddress?: string;
    userAgent?: string;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
}
async function syncUserSessionRecord(
    repository: SessionRepositoryContract | undefined,
    tenantId: string,
    session: NonNullable<AuthSession>,
    metadataInput: SessionMetadataInput,
): Promise<void> {
    if (!repository) {
        return;
    }

    const betterAuthSession = session.session;
    const sessionIdentifier = betterAuthSession.token;
    if (!sessionIdentifier) {
        return;
    }

    const existing = await repository.getUserSession(tenantId, sessionIdentifier);
    const now = new Date();
    const metadata = buildMetadata(session, metadataInput);

    if (!existing) {
        await repository.createUserSession(tenantId, {
            userId: betterAuthSession.userId,
            sessionId: sessionIdentifier,
            status: SessionStatus.active,
            ipAddress: metadataInput.ipAddress ?? betterAuthSession.ipAddress ?? null,
            userAgent: metadataInput.userAgent ?? betterAuthSession.userAgent ?? null,
            startedAt: betterAuthSession.createdAt,
            expiresAt: betterAuthSession.expiresAt,
            lastAccess: now,
            revokedAt: null,
            metadata,
        });
        return;
    }

    await repository.updateUserSession(tenantId, sessionIdentifier, {
        status: SessionStatus.active,
        ipAddress: coalesceUpdateValue(metadataInput.ipAddress, betterAuthSession.ipAddress),
        userAgent: coalesceUpdateValue(metadataInput.userAgent, betterAuthSession.userAgent),
        lastAccess: now,
        metadata,
    });
}
function buildMetadata(
    session: NonNullable<AuthSession>,
    metadataInput: SessionMetadataInput,
): PrismaJsonValue | undefined {
    const payload: Record<string, unknown> = {
        activeOrganizationId: session.session.activeOrganizationId ?? null,
        residency: metadataInput.dataResidency,
        classification: metadataInput.dataClassification,
    };

    if (metadataInput.ipAddress) {
        payload.ipAddress = metadataInput.ipAddress;
    }
    if (metadataInput.userAgent) {
        payload.userAgent = metadataInput.userAgent;
    }

    return Object.keys(payload).length ? buildJsonMetadata(payload) : undefined;
}

function coalesceUpdateValue<TValue extends string | null | undefined>(
    preferred: TValue,
    fallback: TValue,
): string | undefined {
    const candidate = preferred ?? fallback;
    return typeof candidate === 'string' ? candidate : undefined;
}
async function revokeExpiredSession(
    repository: SessionRepositoryContract | undefined,
    authSessionRepository: IAuthSessionRepository | undefined,
    orgId: string,
    session: NonNullable<AuthSession>,
    error: unknown,
    ipAddress?: string,
    userAgent?: string,
): Promise<void> {
    if (!(error instanceof AuthorizationError) || error.details?.reason !== 'session_expired') {
        return;
    }

    const token = session.session.token;
    if (!token) {
        return;
    }

    const details = error.details ?? {};
    const policy = typeof details.policy === 'string' ? details.policy : 'unknown';
    await logSessionExpiryEvent(orgId, session.session.userId, policy, ipAddress, userAgent);

    try {
        await expireAuthSessionToken(token, authSessionRepository);
        await repository?.invalidateUserSession(orgId, token);
    } catch {
        // Best-effort cleanup; authorization error will still be thrown.
    }
}
async function expireAuthSessionToken(
    token: string,
    authSessionRepository: IAuthSessionRepository | undefined,
): Promise<void> {
    await (authSessionRepository ?? defaultAuthSessionRepository).expireSessionByToken(token);
}
async function logSessionExpiryEvent(
    orgId: string,
    userId: string,
    policy: string,
    ipAddress?: string,
    userAgent?: string,
): Promise<void> {
    try {
        await getSecurityEventService().logEvent({
            orgId,
            userId,
            eventType: 'auth.session.expired',
            severity: 'low',
            description: policy === 'idle_timeout'
                ? 'Session expired due to inactivity.'
                : 'Session expired.',
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            metadata: { policy },
        });
    } catch {
        // Best-effort logging only.
    }
}

const defaultAuthSessionRepository = createAuthSessionRepository();
