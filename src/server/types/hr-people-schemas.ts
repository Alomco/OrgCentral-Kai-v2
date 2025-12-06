import { z } from 'zod';
import {
  CONTRACT_TYPE_VALUES,
  EMPLOYMENT_TYPE_VALUES,
  EMPLOYMENT_STATUS_VALUES,
  HEALTH_STATUS_VALUES,
  PAY_SCHEDULE_VALUES,
  SALARY_BASIS_VALUES,
  SALARY_FREQUENCY_VALUES,
  type JsonValue,
} from './hr/people';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from './tenant';

const dateInputSchema = z.union([z.iso.datetime(), z.coerce.date()]);
const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) { return true; }
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (valueType === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }
  return false;
};

const jsonValueSchema = z.custom<JsonValue>((value) => isJsonValue(value), { message: 'Invalid JSON value' });
const phoneSchema = z.object({
  work: z.string().optional(),
  mobile: z.string().optional(),
  home: z.string().optional(),
}).partial();

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).partial();

const contactSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().nullable().optional(),
}).partial();

const salaryDetailSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  frequency: z.enum(['hourly', 'monthly', 'annually']).optional(),
  paySchedule: z.enum(['monthly', 'bi-weekly']).optional(),
}).partial();

const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  dateObtained: dateInputSchema,
  expiryDate: dateInputSchema.optional(),
});

const employmentPeriodSchema = z.object({
  startDate: dateInputSchema,
  endDate: dateInputSchema.nullable().optional(),
});

export const employeeProfileSchema = z.object({
  id: z.uuid(),
  orgId: z.uuid(),
  userId: z.uuid(),
  email: z.email().nullable().optional(),
  personalEmail: z.email().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  employeeNumber: z.string(),
  jobTitle: z.string().nullable().optional(),
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES),
  employmentStatus: z.enum(EMPLOYMENT_STATUS_VALUES),
  departmentId: z.uuid().nullable().optional(),
  startDate: dateInputSchema.nullable().optional(),
  endDate: dateInputSchema.nullable().optional(),
  managerOrgId: z.uuid().nullable().optional(),
  managerUserId: z.uuid().nullable().optional(),
  annualSalary: z.number().nullable().optional(),
  hourlyRate: z.number().nullable().optional(),
  salaryAmount: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  salaryFrequency: z.enum(SALARY_FREQUENCY_VALUES).nullable().optional(),
  salaryBasis: z.enum(SALARY_BASIS_VALUES).nullable().optional(),
  paySchedule: z.enum(PAY_SCHEDULE_VALUES).nullable().optional(),
  costCenter: z.string().nullable().optional(),
  location: jsonValueSchema.optional(),
  niNumber: z.string().nullable().optional(),
  emergencyContact: contactSchema.nullable().optional(),
  nextOfKin: contactSchema.nullable().optional(),
  healthStatus: z.enum(HEALTH_STATUS_VALUES),
  workPermit: jsonValueSchema.optional(),
  bankDetails: jsonValueSchema.optional(),
  metadata: jsonValueSchema.optional(),
  phone: phoneSchema.nullable().optional(),
  address: addressSchema.nullable().optional(),
  roles: z.array(z.string()).optional(),
  eligibleLeaveTypes: z.array(z.string()).optional(),
  employmentPeriods: z.array(employmentPeriodSchema).nullable().optional(),
  salaryDetails: salaryDetailSchema.nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  certifications: z.array(certificationSchema).nullable().optional(),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
  auditSource: z.string().nullable().optional(),
  correlationId: z.string().nullable().optional(),
  schemaVersion: z.number().optional(),
  createdBy: z.uuid().nullable().optional(),
  updatedBy: z.uuid().nullable().optional(),
  retentionPolicy: z.string().nullable().optional(),
  retentionExpiresAt: dateInputSchema.nullable().optional(),
  erasureRequestedAt: dateInputSchema.nullable().optional(),
  erasureCompletedAt: dateInputSchema.nullable().optional(),
  erasureReason: z.string().nullable().optional(),
  erasureActorOrgId: z.uuid().nullable().optional(),
  erasureActorUserId: z.uuid().nullable().optional(),
  archivedAt: dateInputSchema.nullable().optional(),
  deletedAt: dateInputSchema.nullable().optional(),
  createdAt: dateInputSchema,
  updatedAt: dateInputSchema,
});

export const employmentContractSchema = z.object({
  id: z.uuid(),
  orgId: z.uuid(),
  userId: z.uuid(),
  contractType: z.enum(CONTRACT_TYPE_VALUES),
  startDate: dateInputSchema,
  endDate: dateInputSchema.nullable().optional(),
  jobTitle: z.string(),
  departmentId: z.uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  probationEndDate: dateInputSchema.nullable().optional(),
  furloughStartDate: dateInputSchema.nullable().optional(),
  furloughEndDate: dateInputSchema.nullable().optional(),
  workingPattern: jsonValueSchema.optional(),
  benefits: jsonValueSchema.optional(),
  terminationReason: z.string().nullable().optional(),
  terminationNotes: z.string().nullable().optional(),
  archivedAt: dateInputSchema.nullable().optional(),
  deletedAt: dateInputSchema.nullable().optional(),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES).optional(),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS).optional(),
  auditSource: z.string().nullable().optional(),
  correlationId: z.string().nullable().optional(),
  schemaVersion: z.number().optional(),
  createdBy: z.uuid().nullable().optional(),
  updatedBy: z.uuid().nullable().optional(),
  retentionPolicy: z.string().nullable().optional(),
  retentionExpiresAt: dateInputSchema.nullable().optional(),
  erasureRequestedAt: dateInputSchema.nullable().optional(),
  erasureCompletedAt: dateInputSchema.nullable().optional(),
  erasureReason: z.string().nullable().optional(),
  erasureActorOrgId: z.uuid().nullable().optional(),
  erasureActorUserId: z.uuid().nullable().optional(),
  createdAt: dateInputSchema,
  updatedAt: dateInputSchema,
});

export const peopleListFiltersSchema = z.object({
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUS_VALUES).optional(),
});

export const contractListFiltersSchema = z.object({
  status: z.string().optional(),
  contractType: z.enum(CONTRACT_TYPE_VALUES).optional(),
  departmentId: z.uuid().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

export const mutationTelemetrySchema = z.object({
  correlationId: z.uuid().optional(),
  auditSource: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

const profileChangeSetSchema = employeeProfileSchema
  .omit({
    id: true,
    orgId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    dataResidency: true,
    dataClassification: true,
  })
  .partial();

export const profileMutationPayloadSchema = z.object({
  orgId: z.uuid(),
  actorUserId: z.uuid(),
  targetUserId: z.uuid(),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
  changes: profileChangeSetSchema,
  telemetry: mutationTelemetrySchema.optional(),
});

const contractChangeSetSchema = employmentContractSchema
  .omit({
    id: true,
    orgId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    dataResidency: true,
    dataClassification: true,
  })
  .partial();

export const contractMutationPayloadSchema = z.object({
  orgId: z.uuid(),
  actorUserId: z.uuid(),
  targetUserId: z.uuid(),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
  changes: contractChangeSetSchema,
  telemetry: mutationTelemetrySchema.optional(),
});

// Action inputs
export const createEmployeeProfileInputSchema = profileMutationPayloadSchema.extend({
  changes: profileChangeSetSchema.extend({
    employmentType: z.enum(EMPLOYMENT_TYPE_VALUES),
    employeeNumber: z.string().min(1),
  }),
});

export const updateEmployeeProfileInputSchema = profileMutationPayloadSchema.extend({
  profileId: z.uuid(),
});

export const deleteEmployeeProfileInputSchema = z.object({
  orgId: z.uuid(),
  profileId: z.uuid(),
  actorUserId: z.uuid(),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
  telemetry: mutationTelemetrySchema.optional(),
});

export const createEmploymentContractInputSchema = contractMutationPayloadSchema.extend({
  changes: contractChangeSetSchema.extend({
    contractType: z.enum(CONTRACT_TYPE_VALUES),
    jobTitle: z.string(),
    startDate: z.iso.datetime(),
  }),
});

export const updateEmploymentContractInputSchema = contractMutationPayloadSchema.extend({
  contractId: z.uuid(),
});

export const deleteEmploymentContractInputSchema = z.object({
  orgId: z.uuid(),
  contractId: z.uuid(),
  actorUserId: z.uuid(),
  dataResidency: z.enum(DATA_RESIDENCY_ZONES),
  dataClassification: z.enum(DATA_CLASSIFICATION_LEVELS),
  telemetry: mutationTelemetrySchema.optional(),
});

// API Request schemas (server actions / handlers)
export const getEmployeeProfileRequestSchema = z.object({
  profileId: z.uuid(),
});

export const getEmployeeProfileByUserRequestSchema = z.object({
  userId: z.uuid(),
});

export const listEmployeeProfilesRequestSchema = z.object({
  filters: peopleListFiltersSchema.optional(),
});

export const getEmploymentContractRequestSchema = z.object({
  contractId: z.uuid(),
});

export const getEmploymentContractByEmployeeRequestSchema = z.object({
  employeeId: z.uuid(),
});

export const listEmploymentContractsRequestSchema = z.object({
  filters: contractListFiltersSchema.optional(),
});
