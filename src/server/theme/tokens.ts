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
