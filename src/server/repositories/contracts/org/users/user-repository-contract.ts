/**
 * Repository contract for User Membership/Relationships
 * Following SOLID principles with clear separation of concerns
 */
import type { User } from '@/server/types/hr-types';
import type { UserData } from '@/server/types/leave-types';
import type { Membership } from '@/server/types/membership';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { MembershipStatus } from '@prisma/client';

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  userExistsByEmail(email: string): Promise<boolean>;

  /**
   * Get user data by ID for a specific tenant
   */
  getUser(
    tenantId: string,
    userId: string
  ): Promise<UserData | null>;

  /**
   * Update user memberships
   */
  updateUserMemberships(
    context: RepositoryAuthorizationContext,
    userId: string,
    memberships: Membership[]
  ): Promise<void>;

  /**
   * Add user to an organization
   */
  addUserToOrganization(
    context: RepositoryAuthorizationContext,
    userId: string,
    organizationId: string,
    organizationName: string,
    roles: string[]
  ): Promise<void>;

  /**
   * Remove user from an organization
   */
  removeUserFromOrganization(
    context: RepositoryAuthorizationContext,
    userId: string,
    organizationId: string
  ): Promise<void>;

  /**
   * Get all users in an organization
   */
  getUsersInOrganization(
    context: RepositoryAuthorizationContext,
    organizationId: string
  ): Promise<UserData[]>;

  /**
   * Count users in an organization.
   */
  countUsersInOrganization(
    context: RepositoryAuthorizationContext,
    organizationId: string,
    filters?: UserListFilters
  ): Promise<number>;

  /**
   * Get users in an organization with pagination.
   */
  getUsersInOrganizationPaged(
    context: RepositoryAuthorizationContext,
    organizationId: string,
    query: UserPagedQuery
  ): Promise<UserData[]>;
}

export type IUserMembershipRepository = IUserRepository;

export interface UserListFilters {
  search?: string;
  status?: MembershipStatus;
  role?: string;
}

export type UserSortKey = 'name' | 'email' | 'status' | 'role';
export type UserSortDirection = 'asc' | 'desc';

export interface UserSortInput {
  key: UserSortKey;
  direction: UserSortDirection;
}

export interface UserPagedQuery extends UserListFilters {
  page: number;
  pageSize: number;
  sort?: UserSortInput;
}
