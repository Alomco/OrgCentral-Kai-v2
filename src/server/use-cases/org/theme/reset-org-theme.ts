import { AuthorizationError } from '@/server/errors';
import type { IThemeRepository } from '@/server/repositories/contracts/org/theme/theme-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_TENANT_THEME } from '@/server/repositories/cache-scopes';

export interface ResetOrgThemeDependencies {
    themeRepository: IThemeRepository;
}

export interface ResetOrgThemeInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
}

export interface ResetOrgThemeResult {
    success: true;
}

export async function resetOrgTheme(
    deps: ResetOrgThemeDependencies,
    input: ResetOrgThemeInput,
): Promise<ResetOrgThemeResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant theme reset denied.');
    }

    await deps.themeRepository.resetTheme(input.orgId);

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_TENANT_THEME,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    return { success: true };
}
