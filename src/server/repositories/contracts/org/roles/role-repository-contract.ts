/**
 * Repository contract for Roles
 * Following SOLID principles with clear separation of concerns
 */
import type { Role } from '@/server/types/hr-types';

export interface IRoleRepository {
  /**
   * Create a new role
   */
  createRole(
    tenantId: string,
    role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void>;

  /**
   * Update an existing role
   */
  updateRole(
    tenantId: string,
    roleId: string,
    updates: Partial<Omit<Role, 'id' | 'orgId' | 'createdAt'>>
  ): Promise<void>;

  /**
   * Get a specific role by ID
   */
  getRole(
    tenantId: string,
    roleId: string
  ): Promise<Role | null>;

  /**
   * Get role by name
   */
  getRoleByName(
    tenantId: string,
    roleName: string
  ): Promise<Role | null>;

  /**
   * Get all roles for an organization
   */
  getRolesByOrganization(
    tenantId: string,
    filters?: {
      status?: string;
      isCustom?: boolean;
      isDefault?: boolean;
    }
  ): Promise<Role[]>;

  /**
   * Get multiple roles by ids for an organization
   */
  getRolesByIds(
    tenantId: string,
    roleIds: string[]
  ): Promise<Role[]>;

  /**
   * Delete a role
   */
  deleteRole(
    tenantId: string,
    roleId: string
  ): Promise<void>;
}
