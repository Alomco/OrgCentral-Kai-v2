/**
 * Repository contract for Departments
 * Following SOLID principles with clear separation of concerns
 */
import type { Department } from '@/server/types/hr-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export interface IDepartmentRepository {
  /**
   * Create a new department
   */
  createDepartment(
    context: RepositoryAuthorizationContext,
    department: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'headcount'>
  ): Promise<void>;

  /**
   * Update an existing department
   */
  updateDepartment(
    context: RepositoryAuthorizationContext,
    departmentId: string,
    updates: Partial<Omit<Department, 'id' | 'orgId' | 'createdAt' | 'headcount'>>
  ): Promise<void>;

  /**
   * Get a specific department by ID
   */
  getDepartment(
    context: RepositoryAuthorizationContext,
    departmentId: string
  ): Promise<Department | null>;

  /**
   * Get department by code
   */
  getDepartmentByCode(
    context: RepositoryAuthorizationContext,
    code: string
  ): Promise<Department | null>;

  /**
   * Get all departments for an organization
   */
  getDepartmentsByOrganization(
    context: RepositoryAuthorizationContext,
    filters?: {
      status?: string;
      parentId?: string;
    }
  ): Promise<Department[]>;

  /**
   * Delete a department
   */
  deleteDepartment(
    context: RepositoryAuthorizationContext,
    departmentId: string
  ): Promise<void>;
}
