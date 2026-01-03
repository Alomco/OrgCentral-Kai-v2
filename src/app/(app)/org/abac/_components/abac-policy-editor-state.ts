'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { AbacPolicy } from '@/server/security/abac-types';
import type { ConditionDraft, ConditionScope, PolicyDraft } from './abac-policy-types';
import {
    buildDrafts,
    buildPolicies,
    createEmptyPolicyDraft,
    parsePolicyTemplate,
} from './abac-policy-utils';

interface AbacPolicyEditorOptions {
    initialPolicies: AbacPolicy[];
    defaultPolicies: AbacPolicy[];
}

interface LocalMessage {
    status: 'info' | 'error';
    message: string;
}

export function useAbacPolicyEditor({
    initialPolicies,
    defaultPolicies,
}: AbacPolicyEditorOptions) {
    const initialDrafts = useMemo(() => buildDrafts(initialPolicies), [initialPolicies]);
    const [drafts, setDrafts] = useState<PolicyDraft[]>(initialDrafts);
    const [localMessage, setLocalMessage] = useState<LocalMessage | null>(null);
    const [restoreDefaultsPending, setRestoreDefaultsPending] = useState(false);
    const policyCounter = useRef(initialDrafts.length);
    const conditionCounter = useRef(0);
    const fileInputReference = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) {
                return;
            }
            setDrafts(initialDrafts);
            setRestoreDefaultsPending(false);
            policyCounter.current = initialDrafts.length;
            conditionCounter.current = 0;
        });
        return () => {
            cancelled = true;
        };
    }, [initialDrafts]);

    const buildResult = useMemo(() => buildPolicies(drafts), [drafts]);
    const serializedPolicies = useMemo(
        () => JSON.stringify(buildResult.policies, null, 2),
        [buildResult.policies],
    );

    const allowCount = buildResult.policies.filter((policy) => policy.effect === 'allow').length;
    const denyCount = buildResult.policies.filter((policy) => policy.effect === 'deny').length;
    const hasErrors = buildResult.errors.length > 0;

    function updatePolicy(localId: string, updates: Partial<PolicyDraft>) {
        setDrafts((previous) =>
            previous.map((draft) => (draft.localId === localId ? { ...draft, ...updates } : draft)),
        );
    }

    function addPolicy() {
        const nextIndex = policyCounter.current;
        policyCounter.current += 1;
        const localId = `policy-${String(nextIndex)}`;
        setDrafts((previous) => [...previous, createEmptyPolicyDraft(localId)]);
    }

    function removePolicy(localId: string) {
        setDrafts((previous) => previous.filter((draft) => draft.localId !== localId));
    }

    function addItem(localId: string, field: 'actions' | 'resources', value: string) {
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }

        const nextList = dedupe([...getPolicyField(localId, field, drafts), trimmed]);
        if (field === 'actions') {
            updatePolicy(localId, { actions: nextList });
            return;
        }
        updatePolicy(localId, { resources: nextList });
    }

    function removeItem(localId: string, field: 'actions' | 'resources', value: string) {
        const nextList = getPolicyField(localId, field, drafts).filter((item) => item !== value);
        if (field === 'actions') {
            updatePolicy(localId, { actions: nextList });
            return;
        }
        updatePolicy(localId, { resources: nextList });
    }

    function addCondition(localId: string, scope: ConditionScope) {
        const nextIndex = conditionCounter.current;
        conditionCounter.current += 1;
        const newCondition: ConditionDraft = {
            id: `condition-${String(nextIndex)}`,
            key: '',
            operator: 'eq',
            value: '',
        };

        const nextList = [...getPolicyConditions(localId, scope, drafts), newCondition];
        if (scope === 'subject') {
            updatePolicy(localId, { subjectConditions: nextList });
            return;
        }
        updatePolicy(localId, { resourceConditions: nextList });
    }

    function updateCondition(
        localId: string,
        scope: ConditionScope,
        conditionId: string,
        updates: Partial<ConditionDraft>,
    ) {
        const list = getPolicyConditions(localId, scope, drafts).map((condition) =>
            condition.id === conditionId ? { ...condition, ...updates } : condition,
        );

        if (scope === 'subject') {
            updatePolicy(localId, { subjectConditions: list });
            return;
        }
        updatePolicy(localId, { resourceConditions: list });
    }

    function removeCondition(localId: string, scope: ConditionScope, conditionId: string) {
        const list = getPolicyConditions(localId, scope, drafts).filter(
            (condition) => condition.id !== conditionId,
        );

        if (scope === 'subject') {
            updatePolicy(localId, { subjectConditions: list });
            return;
        }
        updatePolicy(localId, { resourceConditions: list });
    }

    function restoreDefaults() {
        if (defaultPolicies.length === 0) {
            setLocalMessage({ status: 'error', message: 'No default policies are available.' });
            return;
        }

        if (!restoreDefaultsPending) {
            setRestoreDefaultsPending(true);
            setLocalMessage({
                status: 'info',
                message: 'Click “Restore defaults” again to confirm replacing current policies.',
            });
            window.setTimeout(() => {
                setRestoreDefaultsPending(false);
            }, 8000);
            return;
        }

        setRestoreDefaultsPending(false);

        const defaults = buildDrafts(defaultPolicies);
        setDrafts(defaults);
        policyCounter.current = defaults.length;
        conditionCounter.current = 0;
        setLocalMessage({ status: 'info', message: 'Default policies loaded. Review and save to apply.' });
    }

    function exportPolicies() {
        if (hasErrors) {
            setLocalMessage({ status: 'error', message: 'Fix validation issues before exporting.' });
            return;
        }

        const blob = new Blob([serializedPolicies], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'abac-policies.json';
        link.click();
        URL.revokeObjectURL(url);
        setLocalMessage({ status: 'info', message: 'Policy template exported.' });
    }

    async function importPolicies(file: File) {
        try {
            const text = await file.text();
            const parsed = parsePolicyTemplate(text);
            if (!parsed.ok) {
                setLocalMessage({ status: 'error', message: parsed.message });
                return;
            }

            const imported = buildDrafts(parsed.policies);
            setDrafts(imported);
            policyCounter.current = imported.length;
            conditionCounter.current = 0;
            setLocalMessage({ status: 'info', message: `Imported ${String(imported.length)} policies.` });
        } catch {
            setLocalMessage({ status: 'error', message: 'Unable to import policy template.' });
        }
    }

    return {
        drafts,
        buildResult,
        serializedPolicies,
        allowCount,
        denyCount,
        hasErrors,
        localMessage,
        fileInputRef: fileInputReference,
        addPolicy,
        removePolicy,
        updatePolicy,
        addItem,
        removeItem,
        addCondition,
        updateCondition,
        removeCondition,
        restoreDefaults,
        exportPolicies,
        importPolicies,
    };
}

function getPolicyField(
    localId: string,
    field: 'actions' | 'resources',
    drafts: PolicyDraft[],
): string[] {
    const draft = drafts.find((item) => item.localId === localId);
    if (!draft) {
        return [];
    }
    return field === 'actions' ? draft.actions : draft.resources;
}

function getPolicyConditions(
    localId: string,
    scope: ConditionScope,
    drafts: PolicyDraft[],
): ConditionDraft[] {
    const draft = drafts.find((item) => item.localId === localId);
    if (!draft) {
        return [];
    }
    return scope === 'subject' ? draft.subjectConditions : draft.resourceConditions;
}

function dedupe(values: string[]): string[] {
    const trimmed = values.map((value) => value.trim()).filter((value) => value.length > 0);
    return Array.from(new Set(trimmed));
}
