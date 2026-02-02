import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { ImpersonationRequest, ImpersonationSession } from '@/server/types/platform/impersonation';

export interface IImpersonationRepository {
    listRequests(context: RepositoryAuthorizationContext): Promise<ImpersonationRequest[]>;
    getRequest(context: RepositoryAuthorizationContext, requestId: string): Promise<ImpersonationRequest | null>;
    createRequest(context: RepositoryAuthorizationContext, request: ImpersonationRequest): Promise<ImpersonationRequest>;
    updateRequest(context: RepositoryAuthorizationContext, request: ImpersonationRequest): Promise<ImpersonationRequest>;

    listSessions(context: RepositoryAuthorizationContext): Promise<ImpersonationSession[]>;
    getSession(context: RepositoryAuthorizationContext, sessionId: string): Promise<ImpersonationSession | null>;
    createSession(context: RepositoryAuthorizationContext, session: ImpersonationSession): Promise<ImpersonationSession>;
    updateSession(context: RepositoryAuthorizationContext, session: ImpersonationSession): Promise<ImpersonationSession>;
}
