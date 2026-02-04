import type { ReactNode } from 'react';

import { getTenantTheme, type TenantThemeCacheContext } from '@/server/theme/get-tenant-theme';
import { defaultUiStyle } from '@/server/theme/ui-style-presets';
import { themeTokenKeys, type ThemeTokenKey, type ThemeTokenMap } from '@/server/theme/tokens';

export type TenantThemeRegistryProps =
    | {
        orgId: string;
        cacheContext: TenantThemeCacheContext;
        children?: ReactNode;
    }
    | {
        orgId?: null;
        cacheContext?: TenantThemeCacheContext;
        children?: ReactNode;
    };

/**
 * All theme tokens that can be customized per tenant.
 * Using the full list from themeTokenKeys for complete customization.
 */
const tenantOverrideKeys = themeTokenKeys;


function normalizeTokenValue(value: string): string {
    return value.trim();
}

function buildCssVariables(tokens: ThemeTokenMap, keys: readonly ThemeTokenKey[]): string {
    return keys
        .map((key) => {
            const normalized = normalizeTokenValue(tokens[key]);
            return `--${key}: ${normalized}; --color-${key}: oklch(${normalized});`;
        })
        .join(' ');
}

/**
 * Server Component that injects tenant-specific theme CSS variables.
 * This enables per-organization color theming throughout the app.
 */
export async function TenantThemeRegistry({
    orgId,
    cacheContext,
    children,
}: TenantThemeRegistryProps) {
    const resolvedOrgId = orgId ?? 'default';

    if (resolvedOrgId !== 'default' && !cacheContext) {
        throw new Error('TenantThemeRegistry requires cacheContext when an orgId is provided.');
    }

    const theme = await getTenantTheme(resolvedOrgId === 'default' ? null : resolvedOrgId, cacheContext);

    const cssVariables = buildCssVariables(theme.tokens, tenantOverrideKeys);
    const darkCssVariables = buildCssVariables(theme.darkTokens, tenantOverrideKeys);
    const uiStyleId = theme.uiStyleId ?? defaultUiStyle;

    return (
        <>
            <style
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: `:root { ${cssVariables} } .dark { ${darkCssVariables} }`,
                }}
            />
            <script
                suppressHydrationWarning
                // Expose the resolved org scope to client code (e.g., local preview overrides).
                dangerouslySetInnerHTML={{
                    __html: `(() => { try { const root = document.documentElement; const nextOrgId = ${JSON.stringify(
                        resolvedOrgId,
                    )}; const nextUiStyleId = ${JSON.stringify(
                        uiStyleId,
                    )}; if (root.dataset.orgId !== nextOrgId) { root.dataset.orgId = nextOrgId; window.dispatchEvent(new Event('orgcentral-org-scope-change')); } if (root.dataset.uiStyle !== nextUiStyleId) { root.dataset.uiStyle = nextUiStyleId; window.dispatchEvent(new Event('orgcentral-ui-style-change')); } if (document.body) { document.body.dataset.uiStyle = nextUiStyleId; } } catch {} })();`,
                }}
            />
            {children}
        </>
    );
}

