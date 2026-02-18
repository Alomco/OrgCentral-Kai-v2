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

const trimmedString = (maxLength: number) => z.string().trim().max(maxLength);

export const phoneSchema = z.object({
  work: trimmedString(32).optional(),
  mobile: trimmedString(32).optional(),
  home: trimmedString(32).optional(),
}).partial();

export const addressSchema = z.object({
  street: trimmedString(160).optional(),
  city: trimmedString(80).optional(),
  state: trimmedString(80).optional(),
  postalCode: trimmedString(24).optional(),
  country: trimmedString(80).optional(),
}).partial();

export const contactSchema = z.object({
  name: trimmedString(120).optional(),
  relationship: trimmedString(80).optional(),
  phone: trimmedString(32).optional(),
  email: z.email().max(254).nullable().optional(),
}).partial();

export const bankDetailsSchema = z.object({
  accountHolderName: trimmedString(120).optional(),
  bankName: trimmedString(120).optional(),
  sortCode: trimmedString(32).optional(),
  accountNumberMasked: trimmedString(32).optional(),
  ibanMasked: trimmedString(48).optional(),
  bicMasked: trimmedString(16).optional(),
  currency: trimmedString(8).optional(),
  country: trimmedString(8).optional(),
  last4: trimmedString(4).optional(),
}).strict();

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
