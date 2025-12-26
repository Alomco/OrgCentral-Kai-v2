import { AuthorizationError } from '@/server/errors';
import type { IThemeRepository } from '@/server/repositories/contracts/org/theme/theme-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_TENANT_THEME } from '@/server/repositories/cache-scopes';
import type { ThemeTokenMap } from '@/server/theme/tokens';

export interface UpdateOrgThemeColorsDependencies {
    themeRepository: IThemeRepository;
}

export interface UpdateOrgThemeColorsInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
    overrides: Partial<Pick<ThemeTokenMap, 'primary' | 'accent'>>;
}

export interface UpdateOrgThemeColorsResult {
    overrides: Partial<Pick<ThemeTokenMap, 'primary' | 'accent'>>;
}

export async function updateOrgThemeColors(
    deps: UpdateOrgThemeColorsDependencies,
    input: UpdateOrgThemeColorsInput,
): Promise<UpdateOrgThemeColorsResult> {
    if (input.orgId !== input.authorization.orgId) {
        throw new AuthorizationError('Cross-tenant theme update denied.');
    }

    const currentTheme = await deps.themeRepository.getTheme(input.orgId);

    await deps.themeRepository.updateTheme(input.orgId, {
        ...currentTheme,
        customOverrides: {
            ...currentTheme?.customOverrides,
            ...input.overrides,
        },
    });

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_TENANT_THEME,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    return { overrides: input.overrides };
}
