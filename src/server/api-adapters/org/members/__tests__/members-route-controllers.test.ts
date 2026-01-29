import { describe, expect, it, vi } from 'vitest';

import type { OrgPermissionMap } from '@/server/security/access-control';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AuthSession } from '@/server/lib/auth';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import { UserService } from '@/server/services/org/users/user-service';
import { listMembersController } from '../members-route-controllers';

vi.mock('@/server/use-cases/auth/sessions/get-session', () => ({
    getSessionContext: vi.fn(),
}));

vi.mock('@/server/services/org/users/user-service.provider', () => ({
    getUserService: vi.fn(),
}));

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getUserService } from '@/server/services/org/users/user-service.provider';

describe('listMembersController', () => {
    it('parses query params and calls service', async () => {
        const permissions: OrgPermissionMap = {};
        const tenantScope = {
            orgId: 'org1',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'test:members',
        } as const;
        const authorization: RepositoryAuthorizationContext = {
            ...tenantScope,
            tenantScope,
            userId: 'user1',
            permissions,
            roleKey: 'owner',
        };

        const session: NonNullable<AuthSession> = {
            session: {
                id: 'session-1',
                token: 'token-1',
                userId: 'user1',
                activeOrganizationId: 'org1',
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 60_000),
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
            },
            user: {
                id: 'user1',
                email: 'user1@example.com',
                name: 'Test User',
                createdAt: new Date(),
                updatedAt: new Date(),
                emailVerified: true,
                twoFactorEnabled: false,
                image: null,
                displayUsername: null,
            },
        };

        vi.mocked(getSessionContext).mockResolvedValue({ authorization, session });

        const listUsersInOrganizationPaged = vi.fn().mockResolvedValue({
            users: [],
            totalCount: 0,
            page: 2,
            pageSize: 10,
        });

        class UserServiceStub extends UserService {
            constructor() {
                const repository: IUserRepository = {
                    findById: async () => null,
                    findByEmail: async () => null,
                    userExistsByEmail: async () => false,
                    create: async () => ({
                        id: 'user1',
                        email: 'user1@example.com',
                        displayName: 'Test User',
                        status: 'ACTIVE',
                        authProvider: 'credentials',
                        failedLoginCount: 0,
                        lastPasswordChange: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }),
                    getUser: async () => null,
                    updateUserMemberships: async () => undefined,
                    addUserToOrganization: async () => undefined,
                    removeUserFromOrganization: async () => undefined,
                    getUsersInOrganization: async () => [],
                    countUsersInOrganization: async () => 0,
                    getUsersInOrganizationPaged: async () => [],
                };
                super({ userRepository: repository });
            }

            override async listUsersInOrganizationPaged(input: {
                authorization: RepositoryAuthorizationContext;
                page: number;
                pageSize: number;
                filters?: { search?: string; status?: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'; role?: string };
                sort?: { key: 'name' | 'email' | 'status' | 'role'; direction: 'asc' | 'desc' };
            }): Promise<{ users: []; totalCount: number; page: number; pageSize: number }> {
                return listUsersInOrganizationPaged(input) as Promise<{ users: []; totalCount: number; page: number; pageSize: number }>;
            }
        }

        vi.mocked(getUserService).mockReturnValue(new UserServiceStub());

        const request = new Request('http://localhost/api/org/org1/members?page=2&pageSize=10&sort=email&dir=desc&role=admin&q=alice&status=ACTIVE');
        const result = await listMembersController(request, 'org1');

        expect(listUsersInOrganizationPaged).toHaveBeenCalledWith({
            authorization,
            page: 2,
            pageSize: 10,
            filters: { search: 'alice', status: 'ACTIVE', role: 'admin' },
            sort: { key: 'email', direction: 'desc' },
        });
        expect(result).toEqual({
            users: [],
            totalCount: 0,
            page: 2,
            pageSize: 10,
        });
    });
});
