'use client';

import { useActionState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import type { AbacPolicy } from '@/server/security/abac-types';
import { useAbacPolicyEditor } from './abac-policy-editor-state';
import { PolicyCard } from './policy-card';
import { abacKeys } from '../abac.api';
import { initialAbacPolicyEditorState } from '../actions.state';
import { updateAbacPoliciesAction } from '../actions';

interface AbacPolicyEditorProps {
    initialPolicies: AbacPolicy[];
    defaultPolicies: AbacPolicy[];
    actionOptions: string[];
    resourceOptions: string[];
}

export function AbacPolicyEditor({
    initialPolicies,
    defaultPolicies,
    actionOptions,
    resourceOptions,
    orgId,
}: AbacPolicyEditorProps & { orgId: string }) {
    const queryClient = useQueryClient();
    const {
        drafts,
        buildResult,
        serializedPolicies,
        allowCount,
        denyCount,
        hasErrors,
        localMessage,
        fileInputRef,
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
    } = useAbacPolicyEditor({ initialPolicies, defaultPolicies });

    const [state, formAction, pending] = useActionState(
        updateAbacPoliciesAction,
        initialAbacPolicyEditorState,
    );

    useEffect(() => {
        if (state.status === 'success') {
            queryClient.invalidateQueries({ queryKey: abacKeys.policies(orgId) }).catch(() => null);
        }
    }, [orgId, queryClient, state.status]);
    return (
        <form action={formAction} className="space-y-6 rounded-2xl bg-[oklch(var(--card)/0.6)] p-6 backdrop-blur" aria-busy={pending}>
            <input type="hidden" name="policiesText" value={serializedPolicies} />
            <div className="space-y-2">
                <p className="text-sm font-semibold text-[oklch(var(--foreground))]">Policy builder</p>
                <p className="text-xs text-[oklch(var(--muted-foreground))]">Build ABAC policies with guided inputs. Changes apply immediately after saving.</p>
                <p className="text-xs text-[oklch(var(--muted-foreground))]">Keep an allow policy for admins or you may lock out updates. Owners always bypass ABAC checks.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={pending || hasErrors}>Save policies</Button>
                <Button type="button" variant="secondary" size="sm" onClick={addPolicy} disabled={pending}>Add policy</Button>
                <Button type="button" variant="secondary" size="sm" onClick={restoreDefaults} disabled={pending}>Restore defaults</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={pending}>Import template</Button>
                <Button type="button" variant="secondary" size="sm" onClick={exportPolicies} disabled={pending || hasErrors}>Export template</Button>
                <span className="text-xs text-[oklch(var(--muted-foreground))]">{buildResult.policies.length} policies ({allowCount} allow, {denyCount} deny)</span>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                aria-label="Import ABAC policy template"
                onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        await importPolicies(file);
                    }
                    event.currentTarget.value = '';
                }}
            />

            {localMessage ? (
                <p className={localMessage.status === 'error' ? 'text-xs text-red-500' : 'text-xs text-[oklch(var(--muted-foreground))]'}>{localMessage.message}</p>
            ) : null}

            {hasErrors ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-500">
                    <p className="font-semibold">Fix the following issues before saving:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                        {buildResult.errors.map((error) => (<li key={error}>{error}</li>))}
                    </ul>
                </div>
            ) : null}

            <div className="space-y-5">
                {drafts.length === 0 ? (
                    <p className="text-sm text-[oklch(var(--muted-foreground))]">No policies defined yet.</p>
                ) : (
                    drafts.map((draft, index) => (
                        <PolicyCard
                            key={draft.localId}
                            draft={draft}
                            index={index}
                            actionOptions={actionOptions}
                            resourceOptions={resourceOptions}
                            onRemove={() => removePolicy(draft.localId)}
                            onUpdate={(updates) => updatePolicy(draft.localId, updates)}
                            onAddItem={(field, value) => addItem(draft.localId, field, value)}
                            onRemoveItem={(field, value) => removeItem(draft.localId, field, value)}
                            onAddCondition={(scope) => addCondition(draft.localId, scope)}
                            onUpdateCondition={(scope, conditionId, updates) => updateCondition(draft.localId, scope, conditionId, updates)}
                            onRemoveCondition={(scope, conditionId) => removeCondition(draft.localId, scope, conditionId)}
                        />
                    ))
                )}
            </div>

            {state.status === 'error' ? (
                <p className="text-xs text-red-500" role="alert">{state.message ?? 'Unable to update policies'}</p>
            ) : null}
            {state.status === 'success' ? (<p className="text-xs text-[oklch(var(--muted-foreground))]">{state.message ?? 'Saved.'}</p>) : null}
        </form>
    );
}