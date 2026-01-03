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

type HslNumber = `${number}`;
type PercentToken = `${number}%`;
export type HslValue = `${HslNumber} ${PercentToken} ${PercentToken}`;

export type ThemeTokenMap = Record<ThemeTokenKey, HslValue>;

export interface TenantTheme {
    orgId: string;
    presetId?: string;
    tokens: ThemeTokenMap;
    darkTokens: ThemeTokenMap;
    updatedAt: Date;
}

const palette = {
    white: '0 0% 100%',
    baseForeground: '222.2 84% 4.9%',
    lightForeground: '210 40% 98%',
    lightSurface: '210 40% 96%',
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '240 5.3% 26.1%',
    sidebarPrimary: '240 5.9% 10%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '240 4.8% 95.9%',
    sidebarAccentForeground: '240 5.9% 10%',
    baseBorder: '214.3 31.8% 91.4%',
    accentRing: '221.2 83.2% 53.3%',
    mutedForeground: '215.4 16.3% 46.9%',
    destructiveForeground: '210 40% 98%',
    destructive: '0 84.2% 60.2%',
    chartOne: '12 76% 61%',
    chartTwo: '173 58% 39%',
    chartThree: '197 37% 24%',
    chartFour: '43 74% 66%',
    chartFive: '27 87% 67%',
    primary: '221.2 83.2% 53.3%',
    sidebarBorder: '220 13% 91%',
    sidebarRing: '217.2 91.2% 59.8%',
} as const satisfies Record<string, HslValue>;

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
    destructive: palette.destructive,
    'destructive-foreground': palette.destructiveForeground,
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

const DARK_FOREGROUND: HslValue = '262 20% 96%';
const DARK_SURFACE: HslValue = '262 45% 9%';
const DARK_PRIMARY: HslValue = '262 90% 68%';
const DARK_SECONDARY: HslValue = '262 35% 15%';
const DARK_BORDER: HslValue = '262 35% 20%';
const DARK_ACCENT: HslValue = '330 85% 65%';

export const defaultDarkThemeTokens = {
    background: '262 47% 7%',
    foreground: DARK_FOREGROUND,
    card: DARK_SURFACE,
    'card-foreground': DARK_FOREGROUND,
    popover: DARK_SURFACE,
    'popover-foreground': DARK_FOREGROUND,
    primary: DARK_PRIMARY,
    'primary-foreground': '0 0% 100%',
    secondary: DARK_SECONDARY,
    'secondary-foreground': DARK_FOREGROUND,
    muted: DARK_SECONDARY,
    'muted-foreground': '262 20% 65%',
    accent: DARK_ACCENT,
    'accent-foreground': '0 0% 100%',
    destructive: '0 72% 58%',
    'destructive-foreground': palette.destructiveForeground,
    border: DARK_BORDER,
    input: DARK_BORDER,
    ring: DARK_PRIMARY,
    'chart-1': DARK_ACCENT,
    'chart-2': DARK_PRIMARY,
    'chart-3': '200 95% 50%',
    'chart-4': '48 96% 65%',
    'chart-5': '31 87% 60%',
    sidebar: DARK_SURFACE,
    'sidebar-background': DARK_SURFACE,
    'sidebar-foreground': DARK_FOREGROUND,
    'sidebar-primary': DARK_PRIMARY,
    'sidebar-primary-foreground': '0 0% 100%',
    'sidebar-accent': DARK_SECONDARY,
    'sidebar-accent-foreground': DARK_FOREGROUND,
    'sidebar-border': DARK_BORDER,
    'sidebar-ring': '217.2 91.2% 59.8%',
} as const satisfies ThemeTokenMap;
