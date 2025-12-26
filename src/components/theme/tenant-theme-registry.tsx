import type { ReactNode } from 'react';

import { getTenantTheme, getTenantThemeWithContext, type TenantThemeCacheContext } from '@/server/theme/get-tenant-theme';
import { themeTokenKeys, type ThemeTokenKey, type ThemeTokenMap } from '@/server/theme/tokens';

export interface TenantThemeRegistryProps {
    orgId?: string | null;
    cacheContext?: TenantThemeCacheContext;
    children?: ReactNode;
}

/**
 * All theme tokens that can be customized per tenant.
 * Using the full list from themeTokenKeys for complete customization.
 */
const tenantOverrideKeys = themeTokenKeys;

function buildCssVariables(tokens: ThemeTokenMap, keys: readonly ThemeTokenKey[]): string {
    return keys
        .map((key) => `--${key}: ${tokens[key]};`)
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
    const theme = cacheContext
        ? await getTenantThemeWithContext(orgId, cacheContext)
        : await getTenantTheme(orgId);

    const resolvedOrgId = orgId ?? 'default';

    const cssVariables = buildCssVariables(theme.tokens, tenantOverrideKeys);

    return (
        <>
            <style
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: `:root { ${cssVariables} } .dark { ${cssVariables} }`,
                }}
            />
            <script
                suppressHydrationWarning
                // Expose the resolved org scope to client code (e.g., local preview overrides).
                dangerouslySetInnerHTML={{
                    __html: `(() => { try { const root = document.documentElement; const nextOrgId = ${JSON.stringify(
                        resolvedOrgId,
                    )}; if (root.dataset.orgId !== nextOrgId) { root.dataset.orgId = nextOrgId; window.dispatchEvent(new Event('orgcentral-org-scope-change')); } } catch {} })();`,
                }}
            />
            {children}
        </>
    );
}

