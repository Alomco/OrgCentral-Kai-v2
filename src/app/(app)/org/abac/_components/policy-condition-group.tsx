'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AbacOperator, ConditionDraft } from './abac-policy-types';

interface ConditionGroupProps {
    title: string;
    conditions: ConditionDraft[];
    onAdd: () => void;
    onUpdate: (conditionId: string, updates: Partial<ConditionDraft>) => void;
    onRemove: (conditionId: string) => void;
}

export function ConditionGroup({
    title,
    conditions,
    onAdd,
    onUpdate,
    onRemove,
}: ConditionGroupProps) {
    return (
        <div className="space-y-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{title}</p>
                <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
                    Add condition
                </Button>
            </div>
            {conditions.length === 0 ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">No conditions added.</p>
            ) : (
                <div className="grid gap-2">
                    {conditions.map((condition) => (
                        <div key={condition.id} className="grid gap-2 md:grid-cols-[1.2fr_0.7fr_1.6fr_auto]">
                            <Input
                                value={condition.key}
                                onChange={(event) => onUpdate(condition.id, { key: event.target.value })}
                                placeholder="Attribute key"
                            />
                            <select
                                value={condition.operator}
                                onChange={(event) =>
                                    onUpdate(condition.id, { operator: event.target.value as AbacOperator })
                                }
                                aria-label="Operator"
                                className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                            >
                                <option value="eq">eq</option>
                                <option value="in">in</option>
                                <option value="ne">ne</option>
                                <option value="gt">gt</option>
                                <option value="lt">lt</option>
                            </select>
                            <Input
                                value={condition.value}
                                onChange={(event) => onUpdate(condition.id, { value: event.target.value })}
                                placeholder='Value or JSON (for example: "member", ["manager"], true)'
                                className="font-mono text-xs"
                            />
                            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(condition.id)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
