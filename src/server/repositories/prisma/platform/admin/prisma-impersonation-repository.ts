import type { IImpersonationRepository } from '@/server/repositories/contracts/platform/admin/impersonation-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { ImpersonationRequest, ImpersonationSession } from '@/server/types/platform/impersonation';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import {
    impersonationRequestRecordSchema,
    impersonationSessionRecordSchema,
} from '@/server/validators/platform/admin/impersonation-validators';
import { loadPlatformSettingJson, savePlatformSettingJson } from '@/server/repositories/prisma/platform/settings/platform-settings-json-store';

const IMPERSONATION_REQUESTS_KEY = 'platform-impersonation-requests';
const IMPERSONATION_SESSIONS_KEY = 'platform-impersonation-sessions';

export class PrismaImpersonationRepository extends BasePrismaRepository implements IImpersonationRepository {
    async listRequests(context: RepositoryAuthorizationContext): Promise<ImpersonationRequest[]> {
        const requests = await loadPlatformSettingJson(
            { prisma: this.prisma },
            IMPERSONATION_REQUESTS_KEY,
            impersonationRequestRecordSchema.array(),
            [],
        );
        return requests.filter((request) => request.orgId === context.orgId);
    }

    async getRequest(context: RepositoryAuthorizationContext, requestId: string): Promise<ImpersonationRequest | null> {
        const requests = await this.listRequests(context);
        return requests.find((request) => request.id === requestId) ?? null;
    }

    async createRequest(context: RepositoryAuthorizationContext, request: ImpersonationRequest): Promise<ImpersonationRequest> {
        const requests = await this.listRequests(context);
        const next = [request, ...requests];
        await savePlatformSettingJson({ prisma: this.prisma }, IMPERSONATION_REQUESTS_KEY, next);
        return request;
    }

    async updateRequest(context: RepositoryAuthorizationContext, request: ImpersonationRequest): Promise<ImpersonationRequest> {
        const requests = await this.listRequests(context);
        const next = requests.map((item) => (item.id === request.id ? request : item));
        await savePlatformSettingJson({ prisma: this.prisma }, IMPERSONATION_REQUESTS_KEY, next);
        return request;
    }

    async listSessions(context: RepositoryAuthorizationContext): Promise<ImpersonationSession[]> {
        const sessions = await loadPlatformSettingJson(
            { prisma: this.prisma },
            IMPERSONATION_SESSIONS_KEY,
            impersonationSessionRecordSchema.array(),
            [],
        );
        return sessions.filter((session) => session.orgId === context.orgId);
    }

    async getSession(context: RepositoryAuthorizationContext, sessionId: string): Promise<ImpersonationSession | null> {
        const sessions = await this.listSessions(context);
        return sessions.find((session) => session.id === sessionId) ?? null;
    }

    async createSession(context: RepositoryAuthorizationContext, session: ImpersonationSession): Promise<ImpersonationSession> {
        const sessions = await this.listSessions(context);
        const next = [session, ...sessions];
        await savePlatformSettingJson({ prisma: this.prisma }, IMPERSONATION_SESSIONS_KEY, next);
        return session;
    }

    async updateSession(context: RepositoryAuthorizationContext, session: ImpersonationSession): Promise<ImpersonationSession> {
        const sessions = await this.listSessions(context);
        const next = sessions.map((item) => (item.id === session.id ? session : item));
        await savePlatformSettingJson({ prisma: this.prisma }, IMPERSONATION_SESSIONS_KEY, next);
        return session;
    }
}
