export const passwordKeys = {
    status: () => ['settings', 'security', 'password-status'] as const,
} as const;

export interface PasswordStatusResponse {
    hasPassword: boolean;
    providers: string[];
    message?: string;
}

export async function fetchPasswordStatus(): Promise<PasswordStatusResponse> {
    const response = await fetch('/api/auth/password-status', { method: 'GET', cache: 'no-store' });
    const data = (await response.json()) as PasswordStatusResponse;

    if (!response.ok) {
        throw new Error(data.message ?? 'Unable to load password status.');
    }

    return {
        hasPassword: data.hasPassword,
        providers: Array.isArray(data.providers) ? data.providers : [],
        message: data.message,
    };
}

export async function setPassword(newPassword: string): Promise<{ message?: string }> {
    const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ newPassword }),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
        throw new Error(data.message ?? 'Unable to set password.');
    }

    return { message: data.message };
}
