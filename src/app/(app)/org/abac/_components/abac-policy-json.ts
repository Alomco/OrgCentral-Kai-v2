import type { AbacAttribute } from '@/server/security/abac-types';
import type { AbacEffect, AbacOperator } from './abac-policy-types';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const OPERATOR_VALUES: readonly AbacOperator[] = ['eq', 'in', 'ne', 'gt', 'lt'];

export function isJsonRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isPrimitive(value: JsonValue): value is JsonPrimitive {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

export function readString(value: JsonValue | undefined): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

export function readNumber(value: JsonValue | undefined): number | undefined {
    return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}

export function readStringArray(value: JsonValue | undefined): string[] {
    if (Array.isArray(value)) {
        return value
            .filter((entry): entry is string => typeof entry === 'string')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }
    return [];
}

export function readEffect(value: JsonValue | undefined): AbacEffect | undefined {
    if (value === 'allow' || value === 'deny') {
        return value;
    }
    return undefined;
}

export function readOperator(value: JsonValue | undefined): AbacOperator | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    return OPERATOR_VALUES.includes(value as AbacOperator) ? (value as AbacOperator) : undefined;
}

export function readAttribute(value: JsonValue | undefined): AbacAttribute | undefined {
    if (value === null) {
        return value;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (Array.isArray(value) && value.every(isPrimitive)) {
        return value;
    }
    return undefined;
}

export function looksLikeJson(value: string): boolean {
    if (value.startsWith('"') || value.startsWith('[') || value.startsWith('{')) {
        return true;
    }
    if (value === 'true' || value === 'false' || value === 'null') {
        return true;
    }
    return /^[+-]?\d+(\.\d+)?$/.test(value);
}
