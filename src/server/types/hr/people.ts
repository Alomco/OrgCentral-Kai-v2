import type { DataClassificationLevel, DataResidencyZone } from '../tenant';

export const EMPLOYMENT_TYPE_VALUES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACTOR',
  'INTERN',
  'APPRENTICE',
  'FIXED_TERM',
  'CASUAL',
] as const;
export type EmploymentTypeCode = typeof EMPLOYMENT_TYPE_VALUES[number];

export const EMPLOYMENT_STATUS_VALUES = [
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
  'ON_LEAVE',
  'OFFBOARDING',
  'ARCHIVED',
] as const;
export type EmploymentStatusCode = typeof EMPLOYMENT_STATUS_VALUES[number];

export const SALARY_FREQUENCY_VALUES = ['HOURLY', 'MONTHLY', 'ANNUALLY'] as const;
export type SalaryFrequencyCode = typeof SALARY_FREQUENCY_VALUES[number];

export const SALARY_BASIS_VALUES = ['ANNUAL', 'HOURLY'] as const;
export type SalaryBasisCode = typeof SALARY_BASIS_VALUES[number];

export const PAY_SCHEDULE_VALUES = ['MONTHLY', 'BI_WEEKLY'] as const;
export type PayScheduleCode = typeof PAY_SCHEDULE_VALUES[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue | undefined };

export const CONTRACT_TYPE_VALUES = [
  'PERMANENT',
  'FIXED_TERM',
  'AGENCY',
  'CONSULTANT',
  'INTERNSHIP',
  'APPRENTICESHIP',
] as const;
export type ContractTypeCode = typeof CONTRACT_TYPE_VALUES[number];

export const HEALTH_STATUS_VALUES = [
  'UNDEFINED',
  'FIT_FOR_WORK',
  'PARTIALLY_FIT',
  'UNFIT_FOR_WORK',
  'RECOVERY_PLAN',
] as const;
export type HealthStatusCode = typeof HEALTH_STATUS_VALUES[number];

export interface PhoneNumbers {
  work?: string;
  mobile?: string;
  home?: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string | null;
}

export interface PostalAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface EmploymentPeriod {
  startDate: Date | string;
  endDate?: Date | string | null;
}

export interface Certification {
  name: string;
  issuer: string;
  dateObtained: Date | string;
  expiryDate?: Date | string;
}

export interface SalaryDetail {
  amount?: number;
  currency?: string;
  frequency?: 'hourly' | 'monthly' | 'annually';
  paySchedule?: 'monthly' | 'bi-weekly';
}

export interface EmployeeProfileDTO {
  id: string;
  orgId: string;
  userId: string;
  email?: string | null;
  personalEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  phone?: PhoneNumbers | null;
  address?: PostalAddress | null;
  roles?: string[];
  eligibleLeaveTypes?: string[];
  employmentStatus: EmploymentStatusCode;
  employmentPeriods?: EmploymentPeriod[] | null;
  salaryDetails?: SalaryDetail | null;
  skills?: string[] | null;
  certifications?: Certification[] | null;
  employeeNumber: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  employmentType: EmploymentTypeCode;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  managerOrgId?: string | null;
  managerUserId?: string | null;
  annualSalary?: number | null;
  hourlyRate?: number | null;
  salaryAmount?: number | null;
  salaryCurrency?: string | null;
  salaryFrequency?: SalaryFrequencyCode | null;
  salaryBasis?: SalaryBasisCode | null;
  paySchedule?: PayScheduleCode | null;
  costCenter?: string | null;
  location?: JsonValue | null;
  niNumber?: string | null;
  emergencyContact?: EmergencyContact | null;
  nextOfKin?: EmergencyContact | null;
  healthStatus: HealthStatusCode;
  workPermit?: JsonValue | null;
  bankDetails?: JsonValue | null;
  metadata?: JsonValue | null;
  dataResidency?: DataResidencyZone;
  dataClassification?: DataClassificationLevel;
  auditSource?: string | null;
  correlationId?: string | null;
  schemaVersion?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  retentionPolicy?: string | null;
  retentionExpiresAt?: Date | string | null;
  erasureRequestedAt?: Date | string | null;
  erasureCompletedAt?: Date | string | null;
  erasureReason?: string | null;
  erasureActorOrgId?: string | null;
  erasureActorUserId?: string | null;
  archivedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EmploymentContractDTO {
  id: string;
  orgId: string;
  userId: string;
  contractType: ContractTypeCode;
  startDate: Date | string;
  endDate?: Date | string | null;
  jobTitle: string;
  departmentId?: string | null;
  location?: string | null;
  probationEndDate?: Date | string | null;
  furloughStartDate?: Date | string | null;
  furloughEndDate?: Date | string | null;
  workingPattern?: JsonValue | null;
  benefits?: JsonValue | null;
  terminationReason?: string | null;
  terminationNotes?: string | null;
  archivedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  dataResidency?: DataResidencyZone;
  dataClassification?: DataClassificationLevel;
  auditSource?: string | null;
  correlationId?: string | null;
  schemaVersion?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  retentionPolicy?: string | null;
  retentionExpiresAt?: Date | string | null;
  erasureRequestedAt?: Date | string | null;
  erasureCompletedAt?: Date | string | null;
  erasureReason?: string | null;
  erasureActorOrgId?: string | null;
  erasureActorUserId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PeopleListFilters {
  startDate?: string;
  endDate?: string;
  employmentStatus?: EmploymentStatusCode;
  employmentType?: EmploymentTypeCode;
  jobTitle?: string;
  departmentId?: string;
  managerOrgId?: string;
  managerUserId?: string;
  search?: string;
}

export interface ContractListFilters {
  status?: string;
  contractType?: ContractTypeCode;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MutationTelemetry {
  correlationId?: string;
  auditSource?: string;
  tags?: string[];
}

export interface ProfileMutationPayload {
  orgId: string;
  actorUserId: string;
  targetUserId: string;
  dataResidency: DataResidencyZone;
  dataClassification: DataClassificationLevel;
  changes: Partial<Omit<EmployeeProfileDTO, 'id' | 'orgId' | 'userId' | 'createdAt' | 'updatedAt'>>;
  telemetry?: MutationTelemetry;
}

export interface ContractMutationPayload {
  orgId: string;
  actorUserId: string;
  targetUserId: string;
  dataResidency: DataResidencyZone;
  dataClassification: DataClassificationLevel;
  changes: Partial<Omit<EmploymentContractDTO, 'id' | 'orgId' | 'userId' | 'createdAt' | 'updatedAt'>>;
  telemetry?: MutationTelemetry;
}
