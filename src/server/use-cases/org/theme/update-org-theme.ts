import { AuthorizationError } from '@/server/errors';
import type { IThemeRepository } from '@/server/repositories/contracts/org/theme/theme-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_TENANT_THEME } from '@/server/repositories/cache-scopes';

export interface UpdateOrgThemeDependencies {
    themeRepository: IThemeRepository;
}

export interface UpdateOrgThemeInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
    presetId: string;
}

export interface UpdateOrgThemeResult {
    presetId: string;
}

export async function updateOrgTheme(
    deps: UpdateOrgThemeDependencies,
    input: UpdateOrgThemeInput,
): Promise<UpdateOrgThemeResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant theme update denied.');
    }

    await deps.themeRepository.updateTheme(input.orgId, { presetId: input.presetId });

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_TENANT_THEME,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    return { presetId: input.presetId };
}
