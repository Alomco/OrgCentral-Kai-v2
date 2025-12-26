import { z } from 'zod';
import { type JsonValue } from './hr/people';

export const dateInputSchema = z.union([z.iso.datetime(), z.coerce.date()]);

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

export const jsonValueSchema = z.custom<JsonValue>((value) => isJsonValue(value), { message: 'Invalid JSON value' });
export const phoneSchema = z.object({
  work: z.string().optional(),
  mobile: z.string().optional(),
  home: z.string().optional(),
}).partial();

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).partial();

export const contactSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().nullable().optional(),
}).partial();

export const salaryDetailSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  frequency: z.enum(['hourly', 'monthly', 'annually']).optional(),
  paySchedule: z.enum(['monthly', 'bi-weekly']).optional(),
}).partial();

export const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  dateObtained: dateInputSchema,
  expiryDate: dateInputSchema.optional(),
});

export const employmentPeriodSchema = z.object({
  startDate: dateInputSchema,
  endDate: dateInputSchema.nullable().optional(),
});
