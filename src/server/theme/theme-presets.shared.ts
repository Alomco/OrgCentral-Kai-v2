import type { ColorTokenValue, ThemeTokenMap } from './tokens';
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
    background: ColorTokenValue,
    foreground: ColorTokenValue,
    surface: ColorTokenValue,
    muted: ColorTokenValue,
    mutedForeground: ColorTokenValue,
    border: ColorTokenValue,
    sidebar: ColorTokenValue,
    sidebarForeground: ColorTokenValue,
];

export type AccentTokens = readonly [
    primary: ColorTokenValue,
    primaryForeground: ColorTokenValue,
    accent: ColorTokenValue,
    accentForeground: ColorTokenValue,
    ring: ColorTokenValue,
    chart1: ColorTokenValue,
    chart2: ColorTokenValue,
    chart3: ColorTokenValue,
    chart4: ColorTokenValue,
    chart5: ColorTokenValue,
    sidebarPrimary: ColorTokenValue,
    sidebarPrimaryForeground: ColorTokenValue,
    sidebarAccent: ColorTokenValue,
    sidebarAccentForeground: ColorTokenValue,
    sidebarRing: ColorTokenValue,
];

export const WHITE = '1.0000 0.0000 0.00' as ColorTokenValue;
export const HSL_CHART_CYAN = '0.5863 0.1366 241.18' as ColorTokenValue;
export const HSL_CHART_YELLOW = '0.8611 0.1734 91.96' as ColorTokenValue;
export const HSL_CHART_ORANGE = '0.7194 0.1662 58.52' as ColorTokenValue;

export const NEON_FOREGROUND = '0.1115 0.0531 273.63' as ColorTokenValue;
export const ROYAL_FOREGROUND = '0.1307 0.0526 306.57' as ColorTokenValue;
export const GALAXY_FOREGROUND = '0.1278 0.0424 266.02' as ColorTokenValue;
export const TANGERINE_FOREGROUND = '0.1743 0.0305 78.88' as ColorTokenValue;
export const INK = '0.12 0.02 255' as ColorTokenValue;
export const LIGHT_MUTED_FOREGROUND = '0.5 0.02 255' as ColorTokenValue;
export const DARK_MUTED_FOREGROUND = '0.7 0.02 255' as ColorTokenValue;
export const LIGHT_BORDER = '0.6 0.01 255' as ColorTokenValue;
export const DARK_BORDER = '0.52 0.01 255' as ColorTokenValue;

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
