/**
 * Repository contract for Leave Policies
 * Following SOLID principles with clear separation of concerns
 */
import type { LeavePolicy } from '@/server/types/leave-types';
import type { TenantScope } from '@/server/types/tenant';

export interface ILeavePolicyRepository {
  /**
   * Create a new leave policy
   */
  createLeavePolicy(
    tenant: TenantScope,
    policy: Omit<LeavePolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void>;

  /**
   * Update an existing leave policy
   */
  updateLeavePolicy(
    tenant: TenantScope,
    policyId: string,
    updates: Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>
  ): Promise<void>;

  /**
   * Get a specific leave policy by ID
   */
  getLeavePolicy(
    tenant: TenantScope,
    policyId: string
  ): Promise<LeavePolicy | null>;

  /**
   * Get a leave policy by name within an organization
   */
  getLeavePolicyByName(
    tenant: TenantScope,
    name: string
  ): Promise<LeavePolicy | null>;

  /**
   * Get all leave policies for an organization
   */
  getLeavePoliciesByOrganization(
    tenant: TenantScope
  ): Promise<LeavePolicy[]>;

  /**
   * Delete a leave policy
   */
  deleteLeavePolicy(
    tenant: TenantScope,
    policyId: string
  ): Promise<void>;
}
