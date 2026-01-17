export const OTP_LENGTH = 6;

interface SessionUser {
    twoFactorEnabled?: boolean | null;
}

interface SessionData {
    user?: SessionUser;
}

export interface StatusMessage {
    tone: 'info' | 'error' | 'success';
    message: string;
}

export interface PasswordStatusResponse {
    hasPassword: boolean;
    providers: string[];
    message?: string;
}

export function resolveMfaEnabled(session: SessionData | null | undefined): boolean {
    const user = session?.user;
    return Boolean(user?.twoFactorEnabled);
}

export function normalizeOtp(value: string): string {
    return value.replace(/\s+/g, '');
}
