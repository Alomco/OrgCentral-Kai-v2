import type { Prisma } from '@prisma/client';

export function toNumber(value: number | { toNumber(): number } | undefined): number {
    if (typeof value === 'number') {
        return value;
    }
    if (!value) {
        return 0;
    }
    return Number(value);
}

export function toJsonValue(value: unknown): Prisma.JsonValue | undefined {
    if (typeof value === 'undefined') {
        return undefined;
    }
    return (value ?? null) as Prisma.JsonValue;
}
