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
            <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                    {icon}
                </span>
                {label}
            </Label>
            <Select value={value} onValueChange={onValueChange} name={id}>
                <SelectTrigger
                    id={id}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white bg-linear-to-br from-white to-slate-50/50 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700/80 dark:bg-linear-to-br dark:from-slate-800/80 dark:to-slate-900/50 dark:text-slate-200 dark:hover:border-indigo-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="cursor-pointer rounded-lg text-sm font-medium transition-colors hover:bg-indigo-50 focus:bg-indigo-50 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-xs text-rose-500">{error}</p>}
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
            <Label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </Label>
            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500">
                        {icon}
                    </div>
                )}
                <Input
                    {...rest}
                    id={inputId}
                    className={cn(
                        "h-11 rounded-xl border-slate-200 bg-white text-sm shadow-sm transition-all duration-200 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:placeholder:text-slate-500 dark:focus-visible:border-indigo-500 dark:focus-visible:ring-indigo-500/20",
                        icon && "pl-10",
                        className,
                    )}
                />
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
    );
}
