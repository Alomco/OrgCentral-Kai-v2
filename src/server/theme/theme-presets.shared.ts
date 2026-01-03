import type { HslValue, ThemeTokenMap } from './tokens';
import { defaultDarkThemeTokens, defaultThemeTokens } from './tokens';

export interface ThemePreset {
    id: string;
    name: string;
    description: string;
    emoji: string;
    tokens: ThemeTokenMap;
    darkTokens: ThemeTokenMap;
}

export type SurfaceTokens = readonly [
    background: HslValue,
    foreground: HslValue,
    surface: HslValue,
    muted: HslValue,
    mutedForeground: HslValue,
    border: HslValue,
    sidebar: HslValue,
    sidebarForeground: HslValue,
];

export type AccentTokens = readonly [
    primary: HslValue,
    primaryForeground: HslValue,
    accent: HslValue,
    accentForeground: HslValue,
    ring: HslValue,
    chart1: HslValue,
    chart2: HslValue,
    chart3: HslValue,
    chart4: HslValue,
    chart5: HslValue,
    sidebarPrimary: HslValue,
    sidebarPrimaryForeground: HslValue,
    sidebarAccent: HslValue,
    sidebarAccentForeground: HslValue,
    sidebarRing: HslValue,
];

export const WHITE = '0 0% 100%' as HslValue;
export const HSL_CHART_CYAN = '200 98% 39%' as HslValue;
export const HSL_CHART_YELLOW = '48 96% 53%' as HslValue;
export const HSL_CHART_ORANGE = '31 87% 51%' as HslValue;

export const NEON_FOREGROUND = '240 84% 5%' as HslValue;
export const ROYAL_FOREGROUND = '270 84% 5%' as HslValue;
export const GALAXY_FOREGROUND = '230 84% 5%' as HslValue;
export const TANGERINE_FOREGROUND = '35 84% 5%' as HslValue;

export function surface(...values: SurfaceTokens): SurfaceTokens {
    return values;
}

export function accents(...values: AccentTokens): AccentTokens {
    return values;
}

function buildTokens(
    base: ThemeTokenMap,
    [background, foreground, surfaceTone, muted, mutedForeground, border, sidebar, sidebarForeground]: SurfaceTokens,
    [
        primary,
        primaryForeground,
        accent,
        accentForeground,
        ring,
        chart1,
        chart2,
        chart3,
        chart4,
        chart5,
        sidebarPrimary,
        sidebarPrimaryForeground,
        sidebarAccent,
        sidebarAccentForeground,
        sidebarRing,
    ]: AccentTokens,
): ThemeTokenMap {
    return {
        ...base,
        background,
        foreground,
        card: surfaceTone,
        'card-foreground': foreground,
        popover: surfaceTone,
        'popover-foreground': foreground,
        secondary: muted,
        'secondary-foreground': foreground,
        muted,
        'muted-foreground': mutedForeground,
        border,
        input: border,
        primary,
        'primary-foreground': primaryForeground,
        accent,
        'accent-foreground': accentForeground,
        ring,
        'chart-1': chart1,
        'chart-2': chart2,
        'chart-3': chart3,
        'chart-4': chart4,
        'chart-5': chart5,
        sidebar,
        'sidebar-background': sidebar,
        'sidebar-foreground': sidebarForeground,
        'sidebar-primary': sidebarPrimary,
        'sidebar-primary-foreground': sidebarPrimaryForeground,
        'sidebar-accent': sidebarAccent,
        'sidebar-accent-foreground': sidebarAccentForeground,
        'sidebar-border': border,
        'sidebar-ring': sidebarRing,
    };
}

export function makePreset(options: {
    id: string;
    name: string;
    description: string;
    emoji: string;
    accents: AccentTokens;
    light: SurfaceTokens;
    dark: SurfaceTokens;
}): ThemePreset {
    return {
        id: options.id,
        name: options.name,
        description: options.description,
        emoji: options.emoji,
        tokens: buildTokens(defaultThemeTokens, options.light, options.accents),
        darkTokens: buildTokens(defaultDarkThemeTokens, options.dark, options.accents),
    };
}
