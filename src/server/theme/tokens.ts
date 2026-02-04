export const themeTokenKeys = [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'border',
    'input',
    'ring',
    'chart-1',
    'chart-2',
    'chart-3',
    'chart-4',
    'chart-5',
    'sidebar',
    'sidebar-background',
    'sidebar-foreground',
    'sidebar-primary',
    'sidebar-primary-foreground',
    'sidebar-accent',
    'sidebar-accent-foreground',
    'sidebar-border',
    'sidebar-ring',
] as const;

export type ThemeTokenKey = typeof themeTokenKeys[number];

export type OklchValue = `${number} ${number} ${number}`;
export type ColorTokenValue = OklchValue;

export type ThemeTokenMap = Record<ThemeTokenKey, ColorTokenValue>;

import type { UiStyleKey } from './ui-style-presets';

export interface TenantTheme {
    orgId: string;
    presetId?: string;
    tokens: ThemeTokenMap;
    darkTokens: ThemeTokenMap;
    uiStyleId?: UiStyleKey;
    updatedAt: Date;
}

const PURE_WHITE: OklchValue = '1.0000 0.0000 0.00';

const palette = {
    white: PURE_WHITE,
    baseForeground: '0.1371 0.0360 258.53',
    lightForeground: '0.9838 0.0035 247.86',
    lightSurface: '0.9676 0.0070 247.90',
    sidebarBackground: '0.9848 0.0000 0.00',
    sidebarForeground: '0.3705 0.0120 285.80',
    sidebarPrimary: '0.2103 0.0059 285.88',
    sidebarPrimaryForeground: '0.9848 0.0000 0.00',
    sidebarAccent: '0.9676 0.0013 286.37',
    sidebarAccentForeground: '0.2103 0.0059 285.88',
    baseBorder: '0.9290 0.0126 255.53',
    accentRing: '0.5460 0.2153 262.87',
    mutedForeground: '0.5547 0.0407 257.44',
    destructiveForeground: '0.9838 0.0035 247.86',
    destructive: '0.6368 0.2078 25.33',
    chartOne: '0.6772 0.1571 35.19',
    chartTwo: '0.6309 0.1013 183.49',
    chartThree: '0.3787 0.0440 225.54',
    chartFour: '0.8336 0.1186 88.15',
    chartFive: '0.7834 0.1261 58.75',
    primary: '0.5460 0.2153 262.87',
    sidebarBorder: '0.9278 0.0058 264.53',
    sidebarRing: '0.6232 0.1879 259.80',
} as const satisfies Record<string, ColorTokenValue>;

export const defaultThemeTokens = {
    background: palette.white,
    foreground: palette.baseForeground,
    card: palette.white,
    'card-foreground': palette.baseForeground,
    popover: palette.white,
    'popover-foreground': palette.baseForeground,
    primary: palette.primary,
    'primary-foreground': palette.lightForeground,
    secondary: palette.lightSurface,
    'secondary-foreground': palette.baseForeground,
    muted: palette.lightSurface,
    'muted-foreground': palette.mutedForeground,
    accent: palette.primary,
    'accent-foreground': palette.lightForeground,
    destructive: '0.55 0.2 30',
    'destructive-foreground': '0.98 0 0',
    border: palette.baseBorder,
    input: palette.baseBorder,
    ring: palette.accentRing,
    'chart-1': palette.chartOne,
    'chart-2': palette.chartTwo,
    'chart-3': palette.chartThree,
    'chart-4': palette.chartFour,
    'chart-5': palette.chartFive,
    sidebar: palette.sidebarBackground,
    'sidebar-background': palette.sidebarBackground,
    'sidebar-foreground': palette.sidebarForeground,
    'sidebar-primary': palette.sidebarPrimary,
    'sidebar-primary-foreground': palette.sidebarPrimaryForeground,
    'sidebar-accent': palette.sidebarAccent,
    'sidebar-accent-foreground': palette.sidebarAccentForeground,
    'sidebar-border': palette.sidebarBorder,
    'sidebar-ring': palette.sidebarRing,
} as const satisfies ThemeTokenMap;

const DARK_FOREGROUND: OklchValue = '0.9657 0.0056 302.84';
const DARK_SURFACE: OklchValue = '0.1796 0.0421 299.03';
const DARK_PRIMARY: OklchValue = '0.6319 0.2105 296.83';
const DARK_SECONDARY: OklchValue = '0.2391 0.0512 299.43';
const DARK_BORDER: OklchValue = '0.2826 0.0651 299.11';
const DARK_ACCENT: OklchValue = '0.6870 0.1997 352.66';

export const defaultDarkThemeTokens = {
    background: '0.1605 0.0354 299.32',
    foreground: DARK_FOREGROUND,
    card: DARK_SURFACE,
    'card-foreground': DARK_FOREGROUND,
    popover: DARK_SURFACE,
    'popover-foreground': DARK_FOREGROUND,
    primary: DARK_PRIMARY,
    'primary-foreground': PURE_WHITE,
    secondary: DARK_SECONDARY,
    'secondary-foreground': DARK_FOREGROUND,
    muted: DARK_SECONDARY,
    'muted-foreground': '0.6897 0.0536 301.74',
    accent: DARK_ACCENT,
    'accent-foreground': PURE_WHITE,
    destructive: '0.55 0.2 30',
    'destructive-foreground': '0.98 0 0',
    border: DARK_BORDER,
    input: DARK_BORDER,
    ring: DARK_PRIMARY,
    'chart-1': DARK_ACCENT,
    'chart-2': DARK_PRIMARY,
    'chart-3': '0.6992 0.1624 241.20',
    'chart-4': '0.8908 0.1551 94.86',
    'chart-5': '0.7637 0.1457 63.85',
    sidebar: DARK_SURFACE,
    'sidebar-background': DARK_SURFACE,
    'sidebar-foreground': DARK_FOREGROUND,
    'sidebar-primary': DARK_PRIMARY,
    'sidebar-primary-foreground': PURE_WHITE,
    'sidebar-accent': DARK_SECONDARY,
    'sidebar-accent-foreground': DARK_FOREGROUND,
    'sidebar-border': DARK_BORDER,
    'sidebar-ring': '0.6232 0.1879 259.80',
} as const satisfies ThemeTokenMap;
