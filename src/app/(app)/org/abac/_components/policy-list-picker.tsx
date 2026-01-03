'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ListPickerProps {
    label: string;
    items: string[];
    suggestions: string[];
    placeholder: string;
    onAdd: (value: string) => void;
    onRemove: (value: string) => void;
}

export function ListPicker({
    label,
    items,
    suggestions,
    placeholder,
    onAdd,
    onRemove,
}: ListPickerProps) {
    const [value, setValue] = useState('');
    const listId = useId();

    function handleAdd() {
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }
        onAdd(trimmed);
        setValue('');
    }

    return (
        <div className="space-y-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
            <div className="flex flex-wrap gap-2">
                {items.length === 0 ? (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">None</span>
                ) : (
                    items.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-xs text-[hsl(var(--foreground))]"
                        >
                            {item}
                            <button
                                type="button"
                                className="text-[10px] uppercase text-[hsl(var(--muted-foreground))]"
                                onClick={() => onRemove(item)}
                            >
                                Remove
                            </button>
                        </span>
                    ))
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    list={listId}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            handleAdd();
                        }
                    }}
                    placeholder={placeholder}
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
                    Add
                </Button>
                <datalist id={listId}>
                    {suggestions.map((option) => (
                        <option key={option} value={option} />
                    ))}
                </datalist>
            </div>
        </div>
    );
}
