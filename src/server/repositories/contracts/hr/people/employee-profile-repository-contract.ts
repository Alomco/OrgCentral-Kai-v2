/**
 * Repository contract for Employee Profiles
 * Following SOLID principles with clear separation of concerns
 */
import type { EmployeeProfileDTO, PeopleListFilters } from '@/server/types/hr/people';

export type EmployeeProfileSortKey = 'name' | 'startDate' | 'status' | 'jobTitle';
export type EmployeeProfileSortDirection = 'asc' | 'desc';

export interface EmployeeProfileSortInput {
  key: EmployeeProfileSortKey;
  direction: EmployeeProfileSortDirection;
}

export interface EmployeeProfilePagedQuery {
  page: number;
  pageSize: number;
  filters?: PeopleListFilters;
  sort?: EmployeeProfileSortInput;
}

export interface IEmployeeProfileRepository {
  /**
   * Create a new employee profile
   */
  createEmployeeProfile(
    tenantId: string,
    profile: Omit<EmployeeProfileDTO, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void>;

  /**
   * Update an existing employee profile
   */
  updateEmployeeProfile(
    tenantId: string,
    profileId: string,
    updates: Partial<Omit<EmployeeProfileDTO, 'id' | 'orgId' | 'userId' | 'createdAt' | 'employeeNumber'>>
  ): Promise<void>;

  /**
   * Get a specific employee profile by ID
   */
  getEmployeeProfile(
    tenantId: string,
    profileId: string
  ): Promise<EmployeeProfileDTO | null>;

  /**
   * Get employee profile by user ID
   */
  getEmployeeProfileByUser(
    tenantId: string,
    userId: string
  ): Promise<EmployeeProfileDTO | null>;

  /**
   * Get all employee profiles for an organization
   */
  getEmployeeProfilesByOrganization(
    tenantId: string,
    filters?: PeopleListFilters
  ): Promise<EmployeeProfileDTO[]>;

  /**
   * Get employee profiles for an organization with pagination and sorting.
   */
  getEmployeeProfilesByOrganizationPaged(
    tenantId: string,
    query: EmployeeProfilePagedQuery
  ): Promise<EmployeeProfileDTO[]>;

  /**
   * Count employee profiles for an organization (supports the same filters as list).
   */
  countEmployeeProfilesByOrganization(
    tenantId: string,
    filters?: PeopleListFilters
  ): Promise<number>;

  /**
   * Find an employee profile by org-scoped employeeNumber
   */
  findByEmployeeNumber(
    tenantId: string,
    employeeNumber: string
  ): Promise<EmployeeProfileDTO | null>;

  /**
   * Find an employee profile by primary email (case-insensitive) within an org
   */
  findByEmail(
    tenantId: string,
    email: string
  ): Promise<EmployeeProfileDTO | null>;

  /**
   * Link a pre-boarding profile to a confirmed user account without recreating the record.
   */
  linkProfileToUser(
    tenantId: string,
    employeeNumber: string,
    userId: string
  ): Promise<void>;

  /**
   * Update compliance status tag for an employee profile (metadata-only until schema adds a column)
   */
  updateComplianceStatus(
    tenantId: string,
    profileId: string,
    complianceStatus: string
  ): Promise<void>;

  /**
   * Delete an employee profile
   */
  deleteEmployeeProfile(
    tenantId: string,
    profileId: string
  ): Promise<void>;
}
