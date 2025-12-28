/**
 * Repository contract for Leave Requests
 * Following SOLID principles with clear separation of concerns
 */
import type { LeaveRequest } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';

export type LeaveRequestCreateInput = Omit<LeaveRequest, 'createdAt'> & { policyId: string; hoursPerDay?: number };
export interface LeaveRequestReadOptions {
  hoursPerDay?: number;
}

export interface ILeaveRequestRepository {
  /**
   * Create a new leave request
   */
  createLeaveRequest(
    tenant: TenantScope,
    request: LeaveRequestCreateInput
  ): Promise<void>;

  /**
   * Update an existing leave request
   */
  updateLeaveRequest(
    tenant: TenantScope,
    requestId: string,
    updates: Partial<Pick<LeaveRequest,
      'status' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt' |
      'rejectionReason' | 'cancelledBy' | 'cancelledAt' | 'cancellationReason' |
      'managerComments'>>
  ): Promise<void>;

  /**
   * Get a specific leave request by ID
   */
  getLeaveRequest(
    tenant: TenantScope,
    requestId: string,
    options?: LeaveRequestReadOptions
  ): Promise<LeaveRequest | null>;

  /**
   * Get all leave requests for a specific employee
   */
  getLeaveRequestsByEmployee(
    tenant: TenantScope,
    employeeId: string,
    options?: LeaveRequestReadOptions
  ): Promise<LeaveRequest[]>;

  /**
   * Get all leave requests for an organization with optional status filter
   */
  getLeaveRequestsByOrganization(
    tenant: TenantScope,
    filters?: { status?: string; startDate?: Date; endDate?: Date },
    options?: LeaveRequestReadOptions
  ): Promise<LeaveRequest[]>;

  /**
   * Count leave requests linked to a specific policy.
   * Used to guard against deleting policies that are already in use.
   */
  countLeaveRequestsByPolicy(
    tenant: TenantScope,
    policyId: string,
  ): Promise<number>;
}
