export function resolveAuthBaseURL(): string {
    return (
        process.env.AUTH_BASE_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        'http://localhost:3000'
    );
}

export function isAuthSyncEnabled(): boolean {
    const value = process.env.AUTH_SYNC_ENABLED;
    if (!value) {
        return true;
    }
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}
