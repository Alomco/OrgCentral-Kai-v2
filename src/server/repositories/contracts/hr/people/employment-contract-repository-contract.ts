/**
 * Repository contract for Employment Contracts
 * Following SOLID principles with clear separation of concerns
 */
import type { ContractListFilters, EmploymentContractDTO } from '@/server/types/hr/people';

export interface IEmploymentContractRepository {
  /**
   * Create a new employment contract
   */
  createEmploymentContract(
    tenantId: string,
    contract: Omit<EmploymentContractDTO, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void>;

  /**
   * Update an existing employment contract
   */
  updateEmploymentContract(
    tenantId: string,
    contractId: string,
    updates: Partial<Omit<EmploymentContractDTO, 'id' | 'orgId' | 'employeeId' | 'userId' | 'createdAt'>>
  ): Promise<void>;

  /**
   * Get a specific employment contract by ID
   */
  getEmploymentContract(
    tenantId: string,
    contractId: string
  ): Promise<EmploymentContractDTO | null>;

  /**
   * Get employment contract by employee ID
   */
  getEmploymentContractByEmployee(
    tenantId: string,
    employeeId: string
  ): Promise<EmploymentContractDTO | null>;

  /**
   * Get all employment contracts for an employee (history, newest first)
   */
  getEmploymentContractsByEmployee(
    tenantId: string,
    employeeId: string
  ): Promise<EmploymentContractDTO[]>;

  /**
   * Get all employment contracts for an organization
   */
  getEmploymentContractsByOrganization(
    tenantId: string,
    filters?: ContractListFilters
  ): Promise<EmploymentContractDTO[]>;

  /**
   * Delete an employment contract
   */
  deleteEmploymentContract(
    tenantId: string,
    contractId: string
  ): Promise<void>;
}
