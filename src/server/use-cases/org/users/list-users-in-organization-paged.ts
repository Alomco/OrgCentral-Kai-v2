import { AuthorizationError } from '@/server/errors';
import type {
    IUserRepository,
    UserListFilters,
    UserPagedQuery,
    UserSortInput,
} from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { UserData } from '@/server/types/leave-types';

export interface ListUsersInOrganizationPagedDependencies {
    userRepository: IUserRepository;
}

export interface ListUsersInOrganizationPagedInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
    page: number;
    pageSize: number;
    filters?: UserListFilters;
    sort?: UserSortInput;
}

export interface ListUsersInOrganizationPagedResult {
    users: UserData[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export async function listUsersInOrganizationPaged(
    deps: ListUsersInOrganizationPagedDependencies,
    input: ListUsersInOrganizationPagedInput,
): Promise<ListUsersInOrganizationPagedResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant user listing denied.');
    }

    const safePageSize = Math.max(1, Math.floor(input.pageSize));
    const totalCount = await deps.userRepository.countUsersInOrganization(
        input.authorization,
        input.orgId,
        input.filters,
    );
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const safePage = Math.min(Math.max(1, Math.floor(input.page)), totalPages);

    const query: UserPagedQuery = {
        page: safePage,
        pageSize: safePageSize,
        search: input.filters?.search,
        status: input.filters?.status,
        role: input.filters?.role,
        sort: input.sort,
    };
    const users = await deps.userRepository.getUsersInOrganizationPaged(
        input.authorization,
        input.orgId,
        query,
    );

    return {
        users,
        totalCount,
        page: safePage,
        pageSize: safePageSize,
    };
}
