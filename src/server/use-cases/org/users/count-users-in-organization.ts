import { AuthorizationError } from '@/server/errors';
import type { IUserRepository, UserListFilters } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export interface CountUsersInOrganizationDependencies {
    userRepository: IUserRepository;
}

export interface CountUsersInOrganizationInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
    filters?: UserListFilters;
}

export interface CountUsersInOrganizationResult {
    totalCount: number;
}

export async function countUsersInOrganization(
    deps: CountUsersInOrganizationDependencies,
    input: CountUsersInOrganizationInput,
): Promise<CountUsersInOrganizationResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant user listing denied.');
    }

    const totalCount = await deps.userRepository.countUsersInOrganization(
        input.authorization,
        input.orgId,
        input.filters,
    );

    return { totalCount };
}
