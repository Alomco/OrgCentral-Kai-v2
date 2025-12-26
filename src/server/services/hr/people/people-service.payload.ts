import type { ZodType } from 'zod';

export function parsePeopleServicePayload<TPayload>(
  schema: ZodType<TPayload>,
  payload: unknown,
): TPayload {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}
