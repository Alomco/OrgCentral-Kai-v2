/**
 * Type definitions for leave-related data structures
 */

import type { Identifier, OrgId, TenantMetadata } from './tenant';
import type { MembershipRole, Membership } from './membership';
import type { LeaveYearStartDate } from './org/leave-year-start-date';

export { DATA_RESIDENCY_ZONES, DATA_CLASSIFICATION_LEVELS } from './tenant';
export type {
  Identifier,
  OrgId,
  TenantMetadata,
  TenantScope,
  DataResidencyZone,
  DataClassificationLevel,
} from './tenant';
export type { MembershipRole, Membership } from './membership';

export type EmployeeId = Identifier;
export type UserId = Identifier;
export type LeaveRequestId = Identifier;
export type LeaveBalanceId = Identifier;
export type LeaveTypeCode = string;
export type PermissionCode = string;
export type ISODateString = string;
export type TimestampString = ISODateString;

export const LEAVE_STATUSES = ['submitted', 'approved', 'rejected', 'cancelled'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_ROUNDING_RULES = ['half_day', 'full_day', 'quarter_day'] as const;
export type LeaveRoundingRule = (typeof LEAVE_ROUNDING_RULES)[number];

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface OrganizationLocation {
  id: Identifier;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  primary?: boolean;
}

export interface LeaveRequest extends TenantMetadata {
  id: LeaveRequestId;
  orgId: OrgId;
  employeeId: EmployeeId;
  userId: UserId;
  employeeName: string;
  leaveType: LeaveTypeCode;
  startDate: ISODateString;
  endDate: ISODateString;
  reason?: string | null;
  totalDays: number;
  isHalfDay: boolean;
  coveringEmployeeId?: EmployeeId | null;
  coveringEmployeeName?: string | null;
  status: LeaveStatus;
  createdAt: TimestampString;
  createdBy: UserId;
  submittedAt?: TimestampString;
  approvedBy?: UserId;
  approvedAt?: TimestampString;
  rejectedBy?: UserId;
  rejectedAt?: TimestampString;
  rejectionReason?: string;
  cancelledBy?: UserId;
  cancelledAt?: TimestampString;
  cancellationReason?: string;
  managerComments?: string | null;
}

export interface LeaveBalance extends TenantMetadata {
  id: LeaveBalanceId;
  orgId: OrgId;
  employeeId: EmployeeId;
  leaveType: LeaveTypeCode;
  year: number;
  totalEntitlement: number;
  used: number;
  pending: number;
  available: number;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export const LEAVE_POLICY_TYPES = [
  'ANNUAL',
  'SICK',
  'MATERNITY',
  'PATERNITY',
  'ADOPTION',
  'UNPAID',
  'SPECIAL',
  'EMERGENCY',
] as const;
export type LeavePolicyType = (typeof LEAVE_POLICY_TYPES)[number];

export const LEAVE_ACCRUAL_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'NONE'] as const;
export type LeaveAccrualFrequency = (typeof LEAVE_ACCRUAL_FREQUENCIES)[number];

export interface LeavePolicy extends TenantMetadata {
  id: string;
  orgId: OrgId;
  departmentId?: string | null;
  name: string;
  policyType: LeavePolicyType;
  accrualFrequency: LeaveAccrualFrequency;
  accrualAmount?: number | null; // amount per accrual period
  carryOverLimit?: number | null;
  requiresApproval: boolean;
  isDefault: boolean;
  activeFrom: TimestampString;
  activeTo?: TimestampString | null;
  statutoryCompliance?: boolean;
  maxConsecutiveDays?: number | null;
  allowNegativeBalance?: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface LeavePolicyAccrual {
  id: string;
  policyId: string;
  tenureMonths: number;
  accrualPerPeriod: number;
  carryOverLimit?: number | null;
  createdAt?: TimestampString;
  updatedAt?: TimestampString;
}

export interface OrganizationData extends TenantMetadata {
  id: OrgId;
  name: string;
  slug: string;
  regionCode: string;
  address?: string;
  phone?: string;
  website?: string;
  companyType?: string;
  incorporationDate?: ISODateString;
  registeredOfficeAddress?: string;
  locations?: OrganizationLocation[];
  primaryBusinessContact?: ContactInfo;
  accountsFinanceContact?: ContactInfo;
  industry?: string;
  employeeCountRange?: string;
  leaveTypes?: LeaveTypeCode[];
  leaveEntitlements: Record<LeaveTypeCode, number>;
  primaryLeaveType: LeaveTypeCode;
  leaveYearStartDate: LeaveYearStartDate;
  leaveRoundingRule: LeaveRoundingRule;
  availablePermissions?: PermissionCode[];
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface UserData {
  id: UserId;
  email: string;
  displayName: string;
  roles: MembershipRole[];
  memberships: Membership[];
  memberOf: OrgId[];
  rolesByOrg?: Record<OrgId, MembershipRole[]>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface EmployeeData extends TenantMetadata {
  id: EmployeeId;
  employeeId: EmployeeId;
  userId: UserId;
  email: string;
  displayName: string;
  organizationId: OrgId;
  status: 'active' | 'archived' | 'offboarding';
  position?: string;
  department?: string;
  managerId?: EmployeeId;
  startDate: ISODateString;
  employmentType?: string;
  eligibleLeaveTypes: LeaveTypeCode[];
  onboardingTemplateId?: string;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}
