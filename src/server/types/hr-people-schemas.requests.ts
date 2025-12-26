import { z } from 'zod';
import { contractListFiltersSchema, peopleListFiltersSchema } from './hr-people-schemas.mutations';

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
