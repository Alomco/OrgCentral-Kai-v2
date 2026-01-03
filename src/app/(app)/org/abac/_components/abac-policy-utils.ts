import type { AbacPolicy } from '@/server/security/abac-types';

import type { AbacEffect, BuildResult, PolicyDraft } from './abac-policy-types';
import { buildConditionBlocks, buildConditionDrafts } from './abac-policy-conditions';

export { parsePolicyTemplate } from './abac-policy-template';
export type { PolicyTemplateParseResult } from './abac-policy-template';

export function createEmptyPolicyDraft(localId: string): PolicyDraft {
    return {
        localId,
        id: '',
        description: '',
        effect: 'allow',
        priority: '',
        actions: [],
        resources: [],
        subjectConditions: [],
        resourceConditions: [],
    };
}

export function buildDrafts(policies: AbacPolicy[]): PolicyDraft[] {
    return policies.map((policy, index) => {
        const indexText = String(index);
        const actions = Array.isArray(policy.actions) ? policy.actions : [];
        const resources = Array.isArray(policy.resources) ? policy.resources : [];
        const effect: AbacEffect = policy.effect === 'deny' ? 'deny' : 'allow';

        return {
            localId: `policy-${indexText}`,
            id: policy.id,
            description: policy.description ?? '',
            effect,
            priority: policy.priority === undefined ? '' : String(policy.priority),
            actions: [...actions],
            resources: [...resources],
            subjectConditions: buildConditionDrafts(policy.condition?.subject, `policy-${indexText}-subject`),
            resourceConditions: buildConditionDrafts(policy.condition?.resource, `policy-${indexText}-resource`),
        };
    });
}

export function buildPolicies(drafts: PolicyDraft[]): BuildResult {
    const errors: string[] = [];
    const policies: AbacPolicy[] = [];
    const seenIds = new Set<string>();

    drafts.forEach((draft, index) => {
        const label = `Policy ${String(index + 1)}`;
        const id = draft.id.trim();
        const actions = normalizeList(draft.actions);
        const resources = normalizeList(draft.resources);

        if (!id) {
            errors.push(`${label}: policy id is required.`);
        } else if (seenIds.has(id)) {
            errors.push(`${label}: duplicate policy id "${id}".`);
        } else {
            seenIds.add(id);
        }

        if (actions.length === 0) {
            errors.push(`${label}: at least one action is required.`);
        }

        if (resources.length === 0) {
            errors.push(`${label}: at least one resource is required.`);
        }

        let priority: number | undefined;
        if (draft.priority.trim()) {
            const parsedPriority = Number(draft.priority);
            if (Number.isNaN(parsedPriority)) {
                errors.push(`${label}: priority must be a number.`);
            } else {
                priority = parsedPriority;
            }
        }

        const { condition, conditionErrors } = buildConditionBlocks(draft, label);
        errors.push(...conditionErrors);

        const policy: AbacPolicy = {
            id,
            effect: draft.effect,
            actions,
            resources,
        };

        const description = draft.description.trim();
        if (description) {
            policy.description = description;
        }
        if (priority !== undefined) {
            policy.priority = priority;
        }
        if (condition) {
            policy.condition = condition;
        }

        policies.push(policy);
    });

    return { policies, errors };
}

function normalizeList(values: string[]): string[] {
    const trimmed = values
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    return Array.from(new Set(trimmed));
}
