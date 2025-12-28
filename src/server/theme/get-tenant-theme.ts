'use server';

import { cacheLife } from 'next/cache';

import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { appLogger } from '@/server/logging/structured-logger';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { CACHE_SCOPE_TENANT_THEME } from '@/server/repositories/cache-scopes';
import { PrismaThemeRepository } from '@/server/repositories/prisma/org/theme/prisma-theme-repository';
import { getThemePreset, defaultPresetId } from './theme-presets';
import type { TenantTheme, ThemeTokenMap } from './tokens';
import type { OrgThemeSettings } from '@/server/types/theme-types';

// Re-export for convenience
export type { OrgThemeSettings };

export interface TenantThemeCacheContext {
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}

const DEFAULT_CLASSIFICATION: DataClassificationLevel = 'OFFICIAL';
const DEFAULT_RESIDENCY: DataResidencyZone = 'UK_ONLY';

/**
 * Get the theme repository instance (uses default Prisma client)
 */
function getThemeRepository(): PrismaThemeRepository {
    return new PrismaThemeRepository();
}

/**
 * Resolve theme tokens from org settings
 */
function resolveThemeFromSettings(
    orgId: string,
    orgSettings: OrgThemeSettings | null,
): TenantTheme {
    // Get base preset (org-specific or default)
    const presetId = orgSettings?.presetId ?? defaultPresetId;
    const preset = getThemePreset(presetId);

    // Apply any custom overrides on top of preset
    const customOverrides = orgSettings?.customOverrides ?? {};

    return {
        orgId,
        presetId,
        tokens: { ...preset.tokens, ...customOverrides } as ThemeTokenMap,
        updatedAt: orgSettings?.updatedAt ?? new Date(),
    };
}

/**
 * Get tenant theme with database lookup and caching
 */
export async function getTenantTheme(orgId?: string | null): Promise<TenantTheme> {
    'use cache';
    cacheLife('hours');

    const resolvedOrgId = orgId ?? 'default';
    registerOrgCacheTag(resolvedOrgId, CACHE_SCOPE_TENANT_THEME, DEFAULT_CLASSIFICATION, DEFAULT_RESIDENCY);

    // For default/anonymous users, use default theme
    if (resolvedOrgId === 'default') {
        return resolveThemeFromSettings('default', null);
    }

    try {
        const repo = getThemeRepository();
        const orgSettings = await repo.getTheme(resolvedOrgId);
        return resolveThemeFromSettings(resolvedOrgId, orgSettings);
    } catch (error) {
        appLogger.warn('theme.load.failed', {
            orgId: resolvedOrgId,
            error: error instanceof Error ? error.message : String(error),
        });
        return resolveThemeFromSettings(resolvedOrgId, null);
    }
}

export async function getTenantThemeWithContext(
    orgId: string | null | undefined,
    context: TenantThemeCacheContext,
): Promise<TenantTheme> {
    'use cache';
    cacheLife('hours');

    const resolvedOrgId = orgId ?? 'default';
    registerOrgCacheTag(resolvedOrgId, CACHE_SCOPE_TENANT_THEME, context.classification, context.residency);

    if (resolvedOrgId === 'default') {
        return resolveThemeFromSettings('default', null);
    }

    try {
        const repo = getThemeRepository();
        const orgSettings = await repo.getTheme(resolvedOrgId);
        return resolveThemeFromSettings(resolvedOrgId, orgSettings);
    } catch (error) {
        appLogger.warn('theme.load.failed', {
            orgId: resolvedOrgId,
            error: error instanceof Error ? error.message : String(error),
        });
        return resolveThemeFromSettings(resolvedOrgId, null);
    }
}

