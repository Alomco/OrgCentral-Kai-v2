import { AuthorizationError } from '@/server/errors';
import type { AuthSession } from '@/server/lib/auth';
import type { OrgSettings } from '@/server/services/org/settings/org-settings-model';

type DateInput = string | number | Date | null | undefined;

interface SessionUserSnapshot {
    twoFactorEnabled?: boolean;
    mfaEnabled?: boolean;
}

interface SessionSnapshot {
    createdAt?: DateInput;
    updatedAt?: DateInput;
    expiresAt?: DateInput;
    ipAddress?: string | null;
    twoFactorVerified?: boolean;
    mfaVerified?: boolean;
    twoFactorEnabled?: boolean;
    mfaEnabled?: boolean;
    user?: SessionUserSnapshot;
}

interface SessionEnvelope {
    session?: SessionSnapshot;
    user?: SessionUserSnapshot;
}

export function enforceOrgSessionSecurity(
    session: NonNullable<AuthSession>,
    settings: OrgSettings,
    requestIp?: string,
): void {
    const envelope = session as SessionEnvelope;
    const sessionInfo = envelope.session;

    const lastActive = resolveDate(sessionInfo?.updatedAt) ?? resolveDate(sessionInfo?.createdAt);
    if (lastActive) {
        const maxAgeMs = settings.security.sessionTimeoutMinutes * 60 * 1000;
        if (Date.now() - lastActive.getTime() > maxAgeMs) {
            throw new AuthorizationError('Session expired for this organization.');
        }
    }

    if (settings.security.mfaRequired) {
        const mfaVerified = resolveMfaVerification(sessionInfo, envelope.user);
        if (!mfaVerified) {
            throw new AuthorizationError('Multi-factor authentication is required for this organization.');
        }
    }

    if (settings.security.ipAllowlistEnabled) {
        const allowlist = settings.security.ipAllowlist;
        if (allowlist.length > 0) {
            const ipAddress = requestIp ?? sessionInfo?.ipAddress ?? '';
            if (!ipAddress) {
                throw new AuthorizationError('IP allowlist requires a client IP address.');
            }
            if (!isIpAllowlisted(ipAddress, allowlist)) {
                throw new AuthorizationError('IP address is not allowlisted for this organization.');
            }
        }
    }
}

function resolveDate(value: DateInput): Date | undefined {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return value;
    }
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
}

function resolveMfaVerification(
    sessionInfo?: SessionSnapshot,
    userInfo?: SessionUserSnapshot,
): boolean {
    const direct = sessionInfo?.twoFactorVerified ?? sessionInfo?.mfaVerified;
    if (typeof direct === 'boolean') {
        return direct;
    }

    const enabled =
        sessionInfo?.twoFactorEnabled ??
        sessionInfo?.mfaEnabled ??
        sessionInfo?.user?.twoFactorEnabled ??
        sessionInfo?.user?.mfaEnabled ??
        userInfo?.twoFactorEnabled ??
        userInfo?.mfaEnabled;

    return enabled === true;
}

function isIpAllowlisted(ipAddress: string, allowlist: string[]): boolean {
    const normalized = ipAddress.trim();
    if (!normalized) {
        return false;
    }
    return allowlist.some((entry) => entry.trim() === normalized);
}
