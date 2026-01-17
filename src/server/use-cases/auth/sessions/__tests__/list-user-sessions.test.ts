import { afterEach, describe, expect, it } from 'vitest';
import { MembershipStatus, SessionStatus } from '@prisma/client';

import { listUserSessions } from '@/server/use-cases/auth/sessions/list-user-sessions';
import type { IUserSessionRepository } from '@/server/repositories/contracts/auth/sessions';
import type { GuardMembershipRecord, IGuardMembershipRepository } from '@/server/repositories/contracts/security/guard-membership-repository-contract';
import { __resetGuardMembershipRepositoryForTests, __setGuardMembershipRepositoryForTests } from '@/server/security/guards';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { UserSession } from '@/server/types/hr-types';

class FakeGuardMembershipRepository implements IGuardMembershipRepository {
    constructor(private readonly record: GuardMembershipRecord | null) {}

    async findMembership(orgId: string, userId: string): Promise<GuardMembershipRecord | null> {
        void orgId;
        void userId;
        return this.record;
    }
}

describe('listUserSessions', () => {
    afterEach(() => {
        __resetGuardMembershipRepositoryForTests();
    });

    it('returns user sessions scoped to the tenant', async () => {
        const membership: GuardMembershipRecord = {
            orgId: 'org-1',
            userId: 'user-1',
            status: MembershipStatus.ACTIVE,
            roleId: null,
            roleName: 'Member',
            roleScope: null,
            rolePermissions: {},
            organization: {
                id: 'org-1',
                name: 'Org One',
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
            },
        };

        __setGuardMembershipRepositoryForTests(new FakeGuardMembershipRepository(membership));

        const sessionRecord: UserSession = {
            id: 'session-1',
            userId: 'user-1',
            sessionId: 'token-1',
            status: SessionStatus.active,
            ipAddress: '192.168.0.1',
            userAgent: 'Mozilla/5.0',
            startedAt: new Date('2025-01-01T10:00:00Z'),
            expiresAt: new Date('2025-01-02T10:00:00Z'),
            lastAccess: new Date('2025-01-01T11:00:00Z'),
            revokedAt: null,
            metadata: null,
        };

        const repository: Pick<IUserSessionRepository, 'getUserSessionsByUser'> = {
            getUserSessionsByUser: async () => [sessionRecord],
        };

        const authorization: RepositoryAuthorizationContext = {
            orgId: 'org-1',
            userId: 'user-1',
            roleKey: 'custom',
            roleName: null,
            roleId: null,
            roleScope: null,
            permissions: {},
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'test',
            tenantScope: {
                orgId: 'org-1',
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
                auditSource: 'test',
            },
        };

        const result = await listUserSessions({ userSessionRepository: repository }, { authorization });

        expect(result.sessions).toHaveLength(1);
        expect(result.sessions[0]?.sessionId).toBe('token-1');
    });
});
