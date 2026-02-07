'use client';

import type { RefObject } from 'react';

import { InfoButton } from '@/components/ui/info-button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface LeavePolicyToggleSection {
    label: string;
    text: string;
}

interface LeavePolicyToggleFieldProps {
    id: string;
    hiddenInputName: string;
    hiddenInputValue: 'on' | 'off';
    hiddenInputReference: RefObject<HTMLInputElement | null>;
    defaultChecked: boolean;
    disabled: boolean;
    label: string;
    infoLabel?: string;
    infoSections?: LeavePolicyToggleSection[];
}

export function LeavePolicyToggleField({
    id,
    hiddenInputName,
    hiddenInputValue,
    hiddenInputReference,
    defaultChecked,
    disabled,
    label,
    infoLabel,
    infoSections,
}: LeavePolicyToggleFieldProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
            <input
                ref={hiddenInputReference}
                type="hidden"
                name={hiddenInputName}
                value={hiddenInputValue}
            />
            <Switch
                id={id}
                defaultChecked={defaultChecked}
                onCheckedChange={(checked) => {
                    if (hiddenInputReference.current) {
                        hiddenInputReference.current.value = checked ? 'on' : 'off';
                    }
                }}
                disabled={disabled}
            />
            <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
            </Label>
            {infoLabel && infoSections ? <InfoButton label={infoLabel} sections={infoSections} /> : null}
        </div>
    );
}
