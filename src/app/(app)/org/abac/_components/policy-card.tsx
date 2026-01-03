'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    AbacEffect,
    ConditionDraft,
    ConditionScope,
    PolicyDraft,
} from './abac-policy-types';
import { ConditionGroup } from './policy-condition-group';
import { ListPicker } from './policy-list-picker';

interface PolicyCardProps {
    draft: PolicyDraft;
    index: number;
    actionOptions: string[];
    resourceOptions: string[];
    onRemove: () => void;
    onUpdate: (updates: Partial<PolicyDraft>) => void;
    onAddItem: (field: 'actions' | 'resources', value: string) => void;
    onRemoveItem: (field: 'actions' | 'resources', value: string) => void;
    onAddCondition: (scope: ConditionScope) => void;
    onUpdateCondition: (scope: ConditionScope, conditionId: string, updates: Partial<ConditionDraft>) => void;
    onRemoveCondition: (scope: ConditionScope, conditionId: string) => void;
}

export function PolicyCard({
    draft,
    index,
    actionOptions,
    resourceOptions,
    onRemove,
    onUpdate,
    onAddItem,
    onRemoveItem,
    onAddCondition,
    onUpdateCondition,
    onRemoveCondition,
}: PolicyCardProps) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Policy {index + 1}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {draft.id ? draft.id : 'New policy'}
                    </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                    Remove
                </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Policy ID</span>
                    <Input
                        value={draft.id}
                        onChange={(event) => onUpdate({ id: event.target.value })}
                        placeholder="policy-id"
                    />
                </label>
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Effect</span>
                    <select
                        value={draft.effect}
                        onChange={(event) => onUpdate({ effect: event.target.value as AbacEffect })}
                        className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                    >
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                    </select>
                </label>
                <label className="grid gap-1 md:col-span-2">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Description</span>
                    <Input
                        value={draft.description}
                        onChange={(event) => onUpdate({ description: event.target.value })}
                        placeholder="Optional description"
                    />
                </label>
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Priority</span>
                    <Input
                        type="number"
                        value={draft.priority}
                        onChange={(event) => onUpdate({ priority: event.target.value })}
                        placeholder="Optional"
                    />
                </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ListPicker
                    label="Actions"
                    items={draft.actions}
                    suggestions={actionOptions}
                    placeholder="Add action"
                    onAdd={(value) => onAddItem('actions', value)}
                    onRemove={(value) => onRemoveItem('actions', value)}
                />
                <ListPicker
                    label="Resources"
                    items={draft.resources}
                    suggestions={resourceOptions}
                    placeholder="Add resource"
                    onAdd={(value) => onAddItem('resources', value)}
                    onRemove={(value) => onRemoveItem('resources', value)}
                />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ConditionGroup
                    title="Subject conditions"
                    conditions={draft.subjectConditions}
                    onAdd={() => onAddCondition('subject')}
                    onRemove={(conditionId) => onRemoveCondition('subject', conditionId)}
                    onUpdate={(conditionId, updates) => onUpdateCondition('subject', conditionId, updates)}
                />
                <ConditionGroup
                    title="Resource conditions"
                    conditions={draft.resourceConditions}
                    onAdd={() => onAddCondition('resource')}
                    onRemove={(conditionId) => onRemoveCondition('resource', conditionId)}
                    onUpdate={(conditionId, updates) => onUpdateCondition('resource', conditionId, updates)}
                />
            </div>
        </div>
    );
}
