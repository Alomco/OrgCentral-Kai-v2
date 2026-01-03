import type {
    AbacAttribute,
    AbacConditionBlock,
    AbacPolicy,
    AbacPredicate,
} from '@/server/security/abac-types';

import type { AbacOperator, ConditionDraft, PolicyDraft } from './abac-policy-types';
import { type JsonValue, looksLikeJson, readAttribute } from './abac-policy-json';

export function buildConditionDrafts(
    block: AbacConditionBlock | undefined,
    prefix: string,
): ConditionDraft[] {
    if (!block) {
        return [];
    }

    return Object.entries(block).map(([key, value], index) => {
        const { operator, valueText } = normalizeConditionValue(value);
        return {
            id: `${prefix}-${String(index)}`,
            key,
            operator,
            value: valueText,
        };
    });
}

function isPredicate(value: AbacAttribute | AbacPredicate | undefined): value is AbacPredicate {
    return value !== null && typeof value === 'object' && 'op' in value && 'value' in value;
}

export function buildConditionBlocks(
    draft: PolicyDraft,
    label: string,
): { condition?: AbacPolicy['condition']; conditionErrors: string[] } {
    const conditionErrors: string[] = [];
    const subject = buildConditionBlock(draft.subjectConditions, `${label} subject`, conditionErrors);
    const resource = buildConditionBlock(draft.resourceConditions, `${label} resource`, conditionErrors);

    const hasSubject = Object.keys(subject).length > 0;
    const hasResource = Object.keys(resource).length > 0;

    if (!hasSubject && !hasResource) {
        return { conditionErrors };
    }

    return {
        condition: {
            subject: hasSubject ? subject : undefined,
            resource: hasResource ? resource : undefined,
        },
        conditionErrors,
    };
}

export function parseConditionValue(
    raw: string,
): { ok: true; value: AbacAttribute } | { ok: false; error: string } {
    const trimmed = raw.trim();
    if (!trimmed) {
        return { ok: false, error: 'Value is required.' };
    }

    if (trimmed.startsWith('$subject.') || trimmed.startsWith('$resource.')) {
        return { ok: true, value: trimmed };
    }

    if (looksLikeJson(trimmed)) {
        try {
            const parsed = JSON.parse(trimmed) as JsonValue;
            const attribute = readAttribute(parsed);
            if (attribute === undefined) {
                return { ok: false, error: 'Value must be a primitive or array of primitives.' };
            }
            return { ok: true, value: attribute };
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? `Invalid JSON value: ${error.message}` : 'Invalid JSON value.',
            };
        }
    }

    return { ok: true, value: trimmed };
}

function buildConditionBlock(
    conditions: ConditionDraft[],
    labelPrefix: string,
    errors: string[],
): AbacConditionBlock {
    const block: AbacConditionBlock = {};

    conditions.forEach((condition, index) => {
        const rowLabel = `${labelPrefix} condition ${String(index + 1)}`;
        const key = condition.key.trim();
        if (!key) {
            errors.push(`${rowLabel}: key is required.`);
            return;
        }

        const parsed = parseConditionValue(condition.value);
        if (!parsed.ok) {
            errors.push(`${rowLabel}: ${parsed.error}`);
            return;
        }

        block[key] = { op: condition.operator, value: parsed.value };
    });

    return block;
}

function normalizeConditionValue(
    value: AbacAttribute | AbacPredicate | undefined,
): { operator: AbacOperator; valueText: string } {
    if (isPredicate(value)) {
        return { operator: value.op, valueText: serializeConditionValue(value.value) };
    }
    return { operator: 'eq', valueText: serializeConditionValue(value) };
}

function serializeConditionValue(value: AbacAttribute | AbacAttribute[] | undefined): string {
    if (value === undefined) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    return JSON.stringify(value);
}
