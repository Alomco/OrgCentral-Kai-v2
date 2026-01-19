import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface TextFieldConfig {
    name: string;
    label: string;
    defaultValue: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
}

export function toDateInputValue(value: string | undefined): string {
    if (!value) {
        return '';
    }

    const trimmed = value.trim();
    const match = /^\d{4}-\d{2}-\d{2}/.exec(trimmed);
    if (match) {
        return match[0];
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toISOString().slice(0, 10);
}

export function TextField({
    name,
    label,
    defaultValue,
    type,
    placeholder,
    required,
    error,
}: TextFieldConfig & { error?: string }) {
    const errorId = error ? `${name}-error` : undefined;
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Input
                name={name}
                type={type}
                defaultValue={defaultValue}
                placeholder={placeholder}
                required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
            />
            {error ? (
                <p id={errorId} className="text-xs text-destructive">
                    {error}
                </p>
            ) : null}
        </label>
    );
}

export function TextAreaField({
    name,
    label,
    defaultValue,
    error,
}: {
    name: string;
    label: string;
    defaultValue: string;
    error?: string;
}) {
    const errorId = error ? `${name}-error` : undefined;
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Textarea
                name={name}
                defaultValue={defaultValue}
                rows={3}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
            />
            {error ? (
                <p id={errorId} className="text-xs text-destructive">
                    {error}
                </p>
            ) : null}
        </label>
    );
}

export function ContactCard({
    title,
    fields,
    errorFor,
}: {
    title: string;
    fields: TextFieldConfig[];
    errorFor: (name: string) => string | undefined;
}) {
    return (
        <div className="grid gap-3 rounded-xl bg-muted/25 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {title}
            </p>
            {fields.map((field) => (
                <TextField key={field.name} {...field} error={errorFor(field.name)} />
            ))}
        </div>
    );
}
