import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { loadOrgSettings } from '@/server/services/org/settings/org-settings-store';
import { ValidationError } from '@/server/errors';

export async function enforceImpersonationSecurity(
    authorization: RepositoryAuthorizationContext,
): Promise<void> {
    if (!authorization.mfaVerified) {
        throw new ValidationError('MFA verification is required for impersonation requests.');
    }

    const settings = await loadOrgSettings(authorization.orgId);
    if (!settings.security.ipAllowlistEnabled) {
        return;
    }

    const ipAddress = authorization.ipAddress;
    if (!ipAddress) {
        throw new ValidationError('IP allowlist requires a client IP address.');
    }

    const allowlist = settings.security.ipAllowlist;
    if (allowlist.length === 0) {
        throw new ValidationError('IP allowlist is enabled but has no entries.');
    }

    const isAllowed = allowlist.some((entry) => entry.trim() === ipAddress.trim());
    if (!isAllowed) {
        throw new ValidationError('IP address is not allowlisted for impersonation.');
    }
}
