import type { AbacPolicy } from '@/server/security/abac-types';

export type AbacEffect = AbacPolicy['effect'];
export type AbacOperator = 'eq' | 'in' | 'ne' | 'gt' | 'lt';
export type ConditionScope = 'subject' | 'resource';

export interface ConditionDraft {
    id: string;
    key: string;
    operator: AbacOperator;
    value: string;
}

export interface PolicyDraft {
    localId: string;
    id: string;
    description: string;
    effect: AbacEffect;
    priority: string;
    actions: string[];
    resources: string[];
    subjectConditions: ConditionDraft[];
    resourceConditions: ConditionDraft[];
}

export interface BuildResult {
    policies: AbacPolicy[];
    errors: string[];
}
