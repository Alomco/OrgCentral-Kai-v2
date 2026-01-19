"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CompactSelectFieldOption<TValue> {
    value: TValue;
    label: string;
}

interface CustomSelectFieldProps<TValue extends string> {
    id: string;
    name: string;
    label: string;
    value: TValue;
    options: CompactSelectFieldOption<TValue>[];
    icon: ReactNode;
    error?: string;
    onValueChange: (value: TValue) => void;
}

export function CustomSelectField<TValue extends string>({
    id,
    label,
    value,
    options,
    icon,
    error,
    onValueChange,
}: CustomSelectFieldProps<TValue>) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    {icon}
                </span>
                {label}
            </Label>
            <Select value={value} onValueChange={onValueChange} name={id}>
                <SelectTrigger
                    id={id}
                    className="h-11 w-full rounded-xl border border-input bg-background/50 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-border/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-input bg-card shadow-2xl">
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="cursor-pointer rounded-lg text-sm font-medium transition-colors hover:bg-muted focus:bg-muted"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: ReactNode;
}

export function InputField({ label, error, icon, className, ...rest }: InputFieldProps) {
    const inputId = rest.id ?? rest.name;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
                {label}
            </Label>
            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </div>
                )}
                <Input
                    {...rest}
                    id={inputId}
                    className={cn(
                        "h-11 rounded-xl border-input bg-background/50 text-sm text-foreground shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
                        icon && "pl-10",
                        className,
                    )}
                />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
