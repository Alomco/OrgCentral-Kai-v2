export interface AdminBootstrapInput {
    token: string;
    signal?: AbortSignal;
}

export interface AdminBootstrapResult {
    redirectTo: string | null;
}

interface BootstrapErrorPayload {
    readonly error?: {
        readonly message?: string;
    };
}

interface BootstrapSuccessPayload {
    readonly redirectTo?: string;
}

function extractErrorMessage(payload: object | null): string | null {
    if (!payload) {
        return null;
    }

    if (!('error' in payload)) {
        return null;
    }

    const candidate = payload as BootstrapErrorPayload;
    const message = candidate.error?.message;
    return typeof message === 'string' && message.trim().length > 0 ? message : null;
}

function extractRedirectTarget(payload: object | null): string | null {
    if (!payload) {
        return null;
    }

    if (!('redirectTo' in payload)) {
        return null;
    }

    const redirectTo = (payload as BootstrapSuccessPayload).redirectTo;
    return typeof redirectTo === 'string' && redirectTo.trim().length > 0 ? redirectTo : null;
}

export async function bootstrapAdmin(input: AdminBootstrapInput): Promise<AdminBootstrapResult> {
    const response = await fetch('/api/auth/admin-bootstrap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: input.token }),
        signal: input.signal,
    });

    const payload = (await response.json().catch(() => null)) as object | null;

    if (!response.ok) {
        const message = extractErrorMessage(payload) ?? `Bootstrap failed (${String(response.status)}).`;
        throw new Error(message);
    }

    const redirectTo = extractRedirectTarget(payload) ?? null;
    return { redirectTo };
}
