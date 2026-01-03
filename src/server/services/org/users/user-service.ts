import type {
    IUserRepository,
    UserListFilters,
    UserSortInput,
} from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';
import type { UserData } from '@/server/types/leave-types';
import { getUsersInOrganization as getUsersInOrganizationUseCase } from '@/server/use-cases/org/users/get-users-in-organization';
import { listUsersInOrganizationPaged as listUsersInOrganizationPagedUseCase } from '@/server/use-cases/org/users/list-users-in-organization-paged';
import { countUsersInOrganization as countUsersInOrganizationUseCase } from '@/server/use-cases/org/users/count-users-in-organization';

const USER_ADMIN_PERMISSIONS: Record<string, string[]> = { organization: ['update'] };
const USER_RESOURCE_TYPE = 'org.user';

export interface UserServiceDependencies {
    userRepository: IUserRepository;
}

export class UserService extends AbstractOrgService {
    constructor(private readonly dependencies: UserServiceDependencies) {
        super();
    }

    async listUsersInOrganization(input: {
        authorization: RepositoryAuthorizationContext;
    }): Promise<UserData[]> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: USER_ADMIN_PERMISSIONS,
            action: 'org.user.list',
            resourceType: USER_RESOURCE_TYPE,
        });

        const context = this.buildContext(input.authorization);

        const getUsersInOrganization = getUsersInOrganizationUseCase as (
            deps: { userRepository: IUserRepository },
            input: { authorization: RepositoryAuthorizationContext; orgId: string },
        ) => Promise<{ users: UserData[] }>;

        return this.executeInServiceContext<UserData[]>(context, 'users.list', async (): Promise<UserData[]> => {
            const { users } = await getUsersInOrganization(
                { userRepository: this.dependencies.userRepository },
                { authorization: input.authorization, orgId: input.authorization.orgId },
            );
            return users;
        });
    }

    async listUsersInOrganizationPaged(input: {
        authorization: RepositoryAuthorizationContext;
        page: number;
        pageSize: number;
        filters?: UserListFilters;
        sort?: UserSortInput;
    }): Promise<{ users: UserData[]; totalCount: number; page: number; pageSize: number }> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: USER_ADMIN_PERMISSIONS,
            action: 'org.user.list',
            resourceType: USER_RESOURCE_TYPE,
        });

        const context = this.buildContext(input.authorization);

        const listUsersInOrganizationPaged = listUsersInOrganizationPagedUseCase as (
            deps: { userRepository: IUserRepository },
            input: {
                authorization: RepositoryAuthorizationContext;
                orgId: string;
                page: number;
                pageSize: number;
                filters?: UserListFilters;
                sort?: UserSortInput;
            },
        ) => Promise<{ users: UserData[]; totalCount: number; page: number; pageSize: number }>;

        return this.executeInServiceContext(context, 'users.list.paged', async () =>
            listUsersInOrganizationPaged(
                { userRepository: this.dependencies.userRepository },
                {
                    authorization: input.authorization,
                    orgId: input.authorization.orgId,
                    page: input.page,
                    pageSize: input.pageSize,
                    filters: input.filters,
                    sort: input.sort,
                },
            ),
        );
    }

    async countUsersInOrganization(input: {
        authorization: RepositoryAuthorizationContext;
        filters?: UserListFilters;
    }): Promise<number> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: USER_ADMIN_PERMISSIONS,
            action: 'org.user.count',
            resourceType: USER_RESOURCE_TYPE,
        });

        const context = this.buildContext(input.authorization);

        const countUsersInOrganization = countUsersInOrganizationUseCase as (
            deps: { userRepository: IUserRepository },
            input: { authorization: RepositoryAuthorizationContext; orgId: string; filters?: UserListFilters },
        ) => Promise<{ totalCount: number }>;

        return this.executeInServiceContext(context, 'users.count', async () => {
            const { totalCount } = await countUsersInOrganization(
                { userRepository: this.dependencies.userRepository },
                { authorization: input.authorization, orgId: input.authorization.orgId, filters: input.filters },
            );
            return totalCount;
        });
    }
}
