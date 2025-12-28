/**
 * Repository contract for Leave Balances
 * Following SOLID principles with clear separation of concerns
 */
import type { LeaveBalance } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';

export type LeaveBalanceCreateInput = Omit<LeaveBalance, 'createdAt' | 'updatedAt'> & { policyId: string };

export interface ILeaveBalanceRepository {
  /**
   * Create a new leave balance record
   */
  createLeaveBalance(
    tenant: TenantScope,
    balance: LeaveBalanceCreateInput
  ): Promise<void>;

  /**
   * Update an existing leave balance
   */
  updateLeaveBalance(
    tenant: TenantScope,
    balanceId: string,
    updates: Partial<{
      used: number;
      pending: number;
      available: number;
      updatedAt: Date;
    }>
  ): Promise<void>;

  /**
   * Get a specific leave balance by ID
   */
  getLeaveBalance(
    tenant: TenantScope,
    balanceId: string
  ): Promise<LeaveBalance | null>;

  /**
   * Get leave balances for an employee in a specific year
   */
  getLeaveBalancesByEmployeeAndYear(
    tenant: TenantScope,
    employeeId: string,
    year: number
  ): Promise<LeaveBalance[]>;

  /**
   * Get all leave balances for an employee regardless of year
   */
  getLeaveBalancesByEmployee(
    tenant: TenantScope,
    employeeId: string
  ): Promise<LeaveBalance[]>;

  /**
   * Count leave balances linked to a specific policy.
   * Used to guard against deleting policies that are already in use.
   */
  countLeaveBalancesByPolicy(
    tenant: TenantScope,
    policyId: string,
  ): Promise<number>;
}
