import { AuthorizationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

const CONFIG_MANAGER_ROLES = new Set(['orgAdmin', 'owner', 'hr']);

export function assertOnboardingConfigManager(authorization: RepositoryAuthorizationContext): void {
    const role = authorization.roleKey;
    if (!CONFIG_MANAGER_ROLES.has(role)) {
        throw new AuthorizationError('You do not have permission to manage onboarding configuration.');
    }
}
