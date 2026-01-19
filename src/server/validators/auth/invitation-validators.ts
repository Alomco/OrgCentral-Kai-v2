import { z } from 'zod';
import { onboardingDataSchema } from '@/server/invitations/onboarding-data';

const jsonSchema = z.record(z.string(), z.any()).optional().nullable();

export const invitationMetadataSchema = jsonSchema;
export const securityContextSchema = jsonSchema;
export { onboardingDataSchema };
