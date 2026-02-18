import { AbstractBaseService } from '@/server/services/abstract-base-service';
import { buildSystemServiceContext } from '@/server/services/auth/service-context';
import type {
    GetSessionDependencies,
    GetSessionInput,
    GetSessionResult,
} from '@/server/use-cases/auth/sessions/get-session';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import type {
    RevokeSessionInput,
    RevokeSessionResult,
} from '@/server/use-cases/auth/sessions/revoke-session';
import { revokeSession } from '@/server/use-cases/auth/sessions/revoke-session';
import { createUserSessionRepository } from '@/server/repositories/providers/auth/user-session-repository-provider';

const GET_OPERATION = 'auth.sessions.get';
const REVOKE_OPERATION = 'auth.sessions.revoke';

export type SessionServiceDependencies = GetSessionDependencies;

export class SessionService extends AbstractBaseService {
    constructor(private readonly dependencies: SessionServiceDependencies) {
        super();
    }

    async getSession(input: GetSessionInput): Promise<GetSessionResult> {
        const context = buildSystemServiceContext({
            auditSource: input.auditSource ?? GET_OPERATION,
            orgId: input.orgId ?? 'unknown-org',
            metadata: {
                action: input.action ?? 'get-session',
                resourceType: input.resourceType ?? 'session',
            },
        });

        return this.executeInServiceContext(context, GET_OPERATION, () =>
            getSessionContext(this.dependencies, input),
        );
    }

    async revokeSession(input: RevokeSessionInput): Promise<RevokeSessionResult> {
        const context = buildSystemServiceContext({
            auditSource: input.auditSource ?? REVOKE_OPERATION,
            orgId: input.orgId ?? 'unknown-org',
            metadata: {
                sessionTokenSuffix: extractTokenSuffix(input.sessionToken),
                action: input.action ?? 'revoke',
            },
        });

        return this.executeInServiceContext(context, REVOKE_OPERATION, () =>
            revokeSession(this.dependencies, input),
        );
    }
}

function extractTokenSuffix(token: string): string {
    return token.length > 8 ? token.slice(-8) : token;
}

let sharedService: SessionService | null = null;

export function getSessionService(
    overrides?: Partial<SessionServiceDependencies>,
): SessionService {
    if (!sharedService || overrides) {
        const dependencies: SessionServiceDependencies = {
            userSessionRepository:
                overrides?.userSessionRepository ?? createUserSessionRepository(),
        };

        if (!overrides) {
            sharedService = new SessionService(dependencies);
            return sharedService;
        }

        return new SessionService({
            userSessionRepository: dependencies.userSessionRepository,
        });
    }

    return sharedService;
}
