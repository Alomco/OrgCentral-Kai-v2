/**
 * HR Admin Hub - Type definitions
 * Single Responsibility: Type contracts for all admin hub components
 */

import type { ReactNode } from 'react';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';

// ============================================================================
// Common Hub Types
// ============================================================================

/** Base props all hub panels receive */
export interface AdminHubPanelProps {
    authorization: RepositoryAuthorizationContext;
}

/** Tab configuration for admin hub navigation */
export interface AdminHubTab {
    id: AdminHubTabId;
    label: string;
    icon: ReactNode;
    description: string;
}

export type AdminHubTabId = 'leave' | 'absences' | 'employees' | 'compliance';

// ============================================================================
// Leave Management Hub Types
// ============================================================================

/** Pending leave request for admin review */
export type PendingLeaveRequest = Pick<LeaveRequest, 
    | 'id' 
    | 'employeeId' 
    | 'employeeName' 
    | 'leaveType' 
    | 'startDate' 
    | 'endDate' 
    | 'totalDays' 
    | 'status' 
    | 'reason'
    | 'submittedAt'
>;

export interface LeaveApprovalFormState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    requestId?: string;
}

// ============================================================================
// Absence Management Hub Types
// ============================================================================

/** Simplified absence view for admin hub */
export interface PendingAbsenceView {
    id: string;
    userId: string;
    typeId: string;
    startDate: Date;
    endDate: Date;
    status: UnplannedAbsence['status'];
}

export interface AbsenceAcknowledgeFormState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    absenceId?: string;
}

// ============================================================================
// Employee Management Hub Types
// ============================================================================

export interface EmployeeSummary {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    position: string | null;
    department: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_ONBOARDING';
    startDate: Date | null;
}

export interface EmployeeStats {
    total: number;
    active: number;
    pendingOnboarding: number;
    inactive: number;
}

// ============================================================================
// Form Action Result Types (Open/Closed - extensible)
// ============================================================================

export interface AdminActionResult<TData = void> {
    success: boolean;
    message: string;
    data?: TData;
    errors?: Record<string, string[]>;
}

// ============================================================================
// Filter/Pagination Types
// ============================================================================

export interface AdminHubFilters {
    status?: string;
    search?: string;
    from?: Date;
    to?: Date;
}

export interface AdminHubPagination {
    page: number;
    pageSize: number;
    total: number;
}
