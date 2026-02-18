const REQUEST_PATH_HEADERS = [
    'next-url',
    'x-next-url',
    'x-invoke-path',
    'x-matched-path',
    'x-original-url',
    'x-rewrite-url',
] as const;

export function normalizeHeaders(input: Headers | HeadersInit): Headers {
    if (input instanceof Headers) {
        return input;
    }
    return new Headers(input);
}

export function resolveRequestPathFromHeaders(headers: Headers): string | null {
    for (const header of REQUEST_PATH_HEADERS) {
        const value = headers.get(header);
        if (!value) {
            continue;
        }

        const normalized = normalizePathHeader(value);
        if (normalized) {
            return normalized;
        }
    }

    return null;
}

function normalizePathHeader(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//') || trimmed.includes('://')) {
            return null;
        }
        return trimmed;
    }

    try {
        const url = new URL(trimmed);
        return `${url.pathname}${url.search}`;
    } catch {
        return null;
    }
}
