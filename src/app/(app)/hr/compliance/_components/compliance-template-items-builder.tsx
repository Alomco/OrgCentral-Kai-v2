'use client';
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ComplianceSubDocumentType, ComplianceTemplateItem } from '@/server/types/compliance-types';
import { FieldError } from '../../_components/field-error';
const TYPE_OPTIONS: { value: ComplianceSubDocumentType; label: string; hint: string }[] = [{ value: 'DOCUMENT', label: 'Document upload', hint: 'Collect a file or photo.' }, { value: 'COMPLETION_DATE', label: 'Completion date', hint: 'Track a specific date.' }, { value: 'YES_NO', label: 'Yes / No confirmation', hint: 'Quick acknowledgment.' }, { value: 'ACKNOWLEDGEMENT', label: 'Acknowledgement', hint: 'Confirm a policy or step.' }];
interface SimpleTemplateItem {
    id: string;
    name: string;
    type: ComplianceSubDocumentType;
    isMandatory: boolean;
    guidanceText: string;
}
export interface ComplianceTemplateItemsBuilderProps {
    name: string;
    inputId?: string;
    initialItems?: ComplianceTemplateItem[];
    initialItemsJson?: string;
    errorId?: string;
    errorMessage?: string;
    disabled?: boolean;
    className?: string;
}
function createEmptyItem(index: number): SimpleTemplateItem {
    return {
        id: `item_${String(index)}`,
        name: '',
        type: 'DOCUMENT',
        isMandatory: true,
        guidanceText: '',
    };
}
function toSimpleItem(item: ComplianceTemplateItem, index: number): SimpleTemplateItem {
    return {
        id: item.id.trim() ? item.id : `item_${String(index + 1)}`,
        name: item.name,
        type: item.type,
        isMandatory: item.isMandatory,
        guidanceText: item.guidanceText ?? '',
    };
}
function normalizeItems(
    initialItems?: ComplianceTemplateItem[],
    initialItemsJson?: string,
): SimpleTemplateItem[] {
    if (initialItems?.length) {
        return initialItems.map(toSimpleItem);
    }

    if (initialItemsJson) {
        try {
            const parsed = JSON.parse(initialItemsJson) as ComplianceTemplateItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(toSimpleItem);
            }
        } catch {
            return [createEmptyItem(1)];
        }
    }

    return [createEmptyItem(1)];
}
function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 64);
}
function buildItemsPayload(items: SimpleTemplateItem[]): ComplianceTemplateItem[] {
    return items.map((item, index) => {
        const name = item.name.trim();
        const derivedId = item.id.trim() || slugify(name) || `item_${String(index + 1)}`;

        return {
            id: derivedId,
            name: name || `Item ${String(index + 1)}`,
            type: item.type,
            isMandatory: item.isMandatory,
            guidanceText: item.guidanceText.trim() || undefined,
        } satisfies ComplianceTemplateItem;
    });
}
export function ComplianceTemplateItemsBuilder({
    name,
    inputId,
    initialItems,
    initialItemsJson,
    errorId,
    errorMessage,
    disabled,
    className,
}: ComplianceTemplateItemsBuilderProps) {
    const [items, setItems] = useState<SimpleTemplateItem[]>(() =>
        normalizeItems(initialItems, initialItemsJson),
    );

    const itemsJson = useMemo(() => {
        const payload = buildItemsPayload(items);
        return JSON.stringify(payload, null, 2);
    }, [items]);

    const updateItem = (index: number, patch: Partial<SimpleTemplateItem>) => {
        setItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item,
            ),
        );
    };

    const addItem = () => {
        setItems((current) => [...current, createEmptyItem(current.length + 1)]);
    };

    const removeItem = (index: number) => {
        setItems((current) => {
            if (current.length === 1) {
                return current;
            }
            return current.filter((_, itemIndex) => itemIndex !== index);
        });
    };

    const isRemoveDisabled = disabled === true || items.length === 1;

    return (
        <div className={cn('space-y-4', className)}>
            <input type="hidden" id={inputId} name={name} value={itemsJson} />
            <div
                className={cn(
                    'rounded-md',
                    errorMessage ? 'bg-destructive/5 ring-1 ring-destructive/40' : 'bg-transparent',
                )}
            >
                <div className="divide-y divide-border/15">
                    {items.map((item, index) => {
                        const typeHint = TYPE_OPTIONS.find((option) => option.value === item.type)?.hint;
                        return (
                            <div key={`${item.id}-${String(index)}`} className="px-3 py-4 first:pt-2 last:pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium">Item {index + 1}</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeItem(index)}
                                        disabled={isRemoveDisabled}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                    </Button>
                                </div>

                                <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
                                    <div className="space-y-1">
                                        <Label>Item name</Label>
                                        <Input
                                            value={item.name}
                                            onChange={(event) => updateItem(index, { name: event.target.value })}
                                            placeholder="Right to work check"
                                            disabled={disabled}
                                        />
                                        <p className="text-xs text-muted-foreground">Use a short, clear title.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Item ID</Label>
                                        <Input
                                            value={item.id}
                                            onChange={(event) => updateItem(index, { id: event.target.value })}
                                            placeholder="right_to_work"
                                            disabled={disabled}
                                        />
                                        <p className="text-xs text-muted-foreground">Auto-filled from the name if left empty.</p>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                                    <div className="space-y-1">
                                        <Label>Requirement type</Label>
                                        <select
                                            value={item.type}
                                            onChange={(event) => updateItem(index, { type: event.target.value as ComplianceSubDocumentType })}
                                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            disabled={disabled}
                                        >
                                            {TYPE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {typeHint ? (
                                            <p className="text-xs text-muted-foreground">{typeHint}</p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            id={`compliance-item-required-${String(index)}`}
                                            checked={item.isMandatory}
                                            onCheckedChange={(checked) => updateItem(index, { isMandatory: checked === true })}
                                            disabled={disabled}
                                        />
                                        <Label htmlFor={`compliance-item-required-${String(index)}`}>
                                            Required item
                                        </Label>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1">
                                    <Label>Helpful guidance (optional)</Label>
                                    <Textarea
                                        value={item.guidanceText}
                                        onChange={(event) => updateItem(index, { guidanceText: event.target.value })}
                                        rows={2}
                                        placeholder="Explain what the user should provide and any acceptable formats."
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="px-3 pb-3 pt-1.5">
                    <Button type="button" variant="secondary" size="sm" onClick={addItem} disabled={disabled}>
                        <Plus className="mr-2 h-4 w-4" /> Add another item
                    </Button>
                </div>
            </div>

            <FieldError id={errorId} message={errorMessage} />

            <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">Advanced: view JSON</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
                    {itemsJson}
                </pre>
            </details>
        </div>
    );
}
