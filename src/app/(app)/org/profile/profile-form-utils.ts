export function normalizeRequiredText(value: FormDataEntryValue | null): string {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
}

export function normalizeNullableText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export function normalizeOptionalText(value: FormDataEntryValue | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
