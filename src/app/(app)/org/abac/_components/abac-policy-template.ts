import type {
    AbacConditionBlock,
    AbacPolicy,
    AbacPredicate,
} from '@/server/security/abac-types';

import {
    type JsonValue,
    isJsonRecord,
    readAttribute,
    readEffect,
    readNumber,
    readOperator,
    readString,
    readStringArray,
} from './abac-policy-json';

export type PolicyTemplateParseResult =
    | { ok: true; policies: AbacPolicy[] }
    | { ok: false; message: string };

export function parsePolicyTemplate(raw: string): PolicyTemplateParseResult {
    let parsed: JsonValue;
    try {
        parsed = JSON.parse(raw) as JsonValue;
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.',
        };
    }

    const policies = normalizePoliciesFromJson(parsed);
    if (policies.length === 0) {
        return { ok: false, message: 'Template must be a JSON array of policies.' };
    }

    return { ok: true, policies };
}

function normalizePoliciesFromJson(input: JsonValue): AbacPolicy[] {
    if (!Array.isArray(input)) {
        return [];
    }

    const policies: AbacPolicy[] = [];
    for (const entry of input) {
        const policy = readPolicy(entry);
        if (policy) {
            policies.push(policy);
        }
    }

    return policies;
}

function readPolicy(value: JsonValue): AbacPolicy | null {
    if (!isJsonRecord(value)) {
        return null;
    }

    const id = readString(value.id);
    const effect = readEffect(value.effect);
    const actions = readStringArray(value.actions);
    const resources = readStringArray(value.resources);

    if (!id || !effect || actions.length === 0 || resources.length === 0) {
        return null;
    }

    const policy: AbacPolicy = {
        id,
        effect,
        actions,
        resources,
    };

    const description = readString(value.description);
    if (description) {
        policy.description = description;
    }

    const priority = readNumber(value.priority);
    if (priority !== undefined) {
        policy.priority = priority;
    }

    const condition = readCondition(value.condition);
    if (condition) {
        policy.condition = condition;
    }

    return policy;
}

function readCondition(value: JsonValue | undefined): AbacPolicy['condition'] | undefined {
    if (!isJsonRecord(value)) {
        return undefined;
    }

    const subject = readConditionBlock(value.subject);
    const resource = readConditionBlock(value.resource);

    if (!subject && !resource) {
        return undefined;
    }

    return {
        subject,
        resource,
    };
}

function readConditionBlock(value: JsonValue | undefined): AbacConditionBlock | undefined {
    if (!isJsonRecord(value)) {
        return undefined;
    }

    const block: AbacConditionBlock = {};

    for (const [key, entry] of Object.entries(value)) {
        const predicate = readPredicate(entry);
        if (predicate) {
            block[key] = predicate;
            continue;
        }

        const attribute = readAttribute(entry);
        if (attribute !== undefined) {
            block[key] = attribute;
        }
    }

    return Object.keys(block).length > 0 ? block : undefined;
}

function readPredicate(value: JsonValue): AbacPredicate | null {
    if (!isJsonRecord(value)) {
        return null;
    }

    const op = readOperator(value.op);
    if (!op) {
        return null;
    }

    const attribute = readAttribute(value.value);
    if (attribute === undefined) {
        return null;
    }

    return { op: op, value: attribute };
}
