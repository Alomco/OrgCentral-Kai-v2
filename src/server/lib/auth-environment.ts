export function resolveAuthBaseURL(): string {
    const configuredBaseUrl = process.env.AUTH_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

    if (configuredBaseUrl) {
        return configuredBaseUrl;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('AUTH_BASE_URL or NEXT_PUBLIC_APP_URL must be set in production.');
    }

    return 'http://localhost:3000';
}

export function isAuthSyncEnabled(): boolean {
    const value = process.env.AUTH_SYNC_ENABLED;
    if (!value) {
        return process.env.NODE_ENV !== 'production';
    }
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}
