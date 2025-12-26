import type { ZodError } from 'zod';

export type FieldErrors<T> = Partial<Record<Extract<keyof T, string>, string>>;

export function toFieldErrors<T>(error: ZodError<T>): FieldErrors<T> {
    return error.issues.reduce<FieldErrors<T>>((accumulator, issue) => {
        const key = issue.path[0];
        if (typeof key === 'string' && !accumulator[key as Extract<keyof T, string>]) {
            accumulator[key as Extract<keyof T, string>] = issue.message;
        }
        return accumulator;
    }, {});
}
