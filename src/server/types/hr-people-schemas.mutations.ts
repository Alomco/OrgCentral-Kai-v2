import { z } from 'zod';
import { CONTRACT_TYPE_VALUES, EMPLOYMENT_STATUS_VALUES, EMPLOYMENT_TYPE_VALUES } from './hr/people';
import { DATA_CLASSIFICATION_LEVELS, DATA_RESIDENCY_ZONES } from './tenant';
import { employeeProfileSchema } from './hr-people-schemas.profile';
import { employmentContractSchema } from './hr-people-schemas.contract';

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
