import type { ColorTokenValue } from './tokens';
import {
    accents,
    DARK_BORDER,
    DARK_MUTED_FOREGROUND,
    HSL_CHART_CYAN,
    HSL_CHART_ORANGE,
    HSL_CHART_YELLOW,
    INK,
    LIGHT_BORDER,
    LIGHT_MUTED_FOREGROUND,
    makePreset,
    NEON_FOREGROUND,
    ROYAL_FOREGROUND,
    surface,
    WHITE,
} from './theme-presets.shared';
import type { ThemePreset } from './theme-presets.shared';

const cyberpunkPrimary: ColorTokenValue = '0.5424 0.2454 293.02';
const sunsetPrimary: ColorTokenValue = '0.7065 0.1860 48.13';
const sunsetAccent: ColorTokenValue = '0.6108 0.2162 18.15';
const forestPrimary: ColorTokenValue = '0.6902 0.1481 162.37';
const neonPrimary: ColorTokenValue = '0.6230 0.2799 310.69';
const neonAccent: ColorTokenValue = '0.9054 0.1546 194.77';
const royalPrimary: ColorTokenValue = '0.4726 0.2246 299.96';
const royalAccent: ColorTokenValue = '0.8153 0.1652 85.67';

export const themePresetsGroupA = {
    'cyberpunk-purple': makePreset({
        id: 'cyberpunk-purple',
        name: 'Cyberpunk Purple',
        description: 'Vibrant purple and pink with neon accents',
        emoji: '??',
        accents: accents(cyberpunkPrimary, WHITE, '0.6538 0.2133 354.06', INK, cyberpunkPrimary, '0.6538 0.2133 354.06', cyberpunkPrimary, HSL_CHART_CYAN, HSL_CHART_YELLOW, HSL_CHART_ORANGE, '0.6075 0.2126 296.39', WHITE, '0.6164 0.2078 354.57', WHITE, cyberpunkPrimary),
        light: surface('0.9791 0.0084 302.80', '0.1993 0.0696 296.41', '0.9900 0.0035 302.87', '0.9456 0.0127 302.72', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9722 0.0074 302.81', '0.2995 0.0705 299.02'),
        dark: surface('0.1705 0.0381 299.25', '0.9657 0.0056 302.84', '0.2091 0.0481 299.12', '0.2480 0.0540 299.35', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.1886 0.0461 298.83', '0.9138 0.0143 302.69'),
    }),
    'ocean-depths': makePreset({
        id: 'ocean-depths',
        name: 'Ocean Depths',
        description: 'Deep blues and cyan with aquatic vibes',
        emoji: '??',
        accents: accents(HSL_CHART_CYAN, INK, '0.7041 0.1211 185.38', INK, HSL_CHART_CYAN, '0.7041 0.1211 185.38', HSL_CHART_CYAN, '0.5742 0.2135 262.12', HSL_CHART_YELLOW, HSL_CHART_ORANGE, '0.8318 0.1437 185.27', WHITE, '0.6395 0.1445 240.11', WHITE, HSL_CHART_CYAN),
        light: surface('0.9853 0.0051 228.82', '0.2322 0.0330 249.41', '0.9926 0.0021 228.78', '0.9477 0.0105 228.90', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9777 0.0051 228.82', '0.3141 0.0398 249.20'),
        dark: surface('0.1940 0.0243 240.73', '0.9396 0.0069 228.85', '0.2389 0.0310 240.86', '0.2808 0.0313 240.36', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2165 0.0266 240.66', '0.9244 0.0087 228.87'),
    }),
    'sunset-blaze': makePreset({
        id: 'sunset-blaze',
        name: 'Sunset Blaze',
        description: 'Warm oranges and fiery reds',
        emoji: '??',
        accents: accents(sunsetPrimary, INK, sunsetAccent, INK, '0.6 0.18 25', sunsetAccent, sunsetPrimary, '0.7858 0.1598 85.31', HSL_CHART_YELLOW, '0.5786 0.2137 27.17', '0.7410 0.1645 52.17', WHITE, '0.6358 0.1884 14.61', WHITE, sunsetPrimary),
        light: surface('0.9783 0.0109 58.21', '0.2412 0.0411 46.73', '0.9927 0.0034 58.31', '0.9412 0.0207 58.06', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9708 0.0120 58.19', '0.3238 0.0465 47.17'),
        dark: surface('0.2055 0.0264 47.37', '0.9399 0.0104 58.21', '0.2407 0.0296 50.93', '0.2857 0.0327 54.69', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2188 0.0284 50.81', '0.9241 0.0108 56.27'),
    }),
    'forest-emerald': makePreset({
        id: 'forest-emerald',
        name: 'Forest Emerald',
        description: 'Rich greens with natural energy',
        emoji: '??',
        accents: accents(forestPrimary, INK, '0.6839 0.2089 142.86', INK, '0.58 0.16 160', '0.6839 0.2089 142.86', forestPrimary, '0.6806 0.1109 194.86', HSL_CHART_YELLOW, '0.6505 0.1637 132.80', '0.7678 0.1655 162.19', WHITE, '0.7245 0.2144 142.96', WHITE, forestPrimary),
        light: surface('0.9828 0.0114 164.84', '0.2656 0.0346 169.81', '0.9939 0.0032 165.06', '0.9464 0.0153 164.71', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9745 0.0101 164.87', '0.3528 0.0411 170.48'),
        dark: surface('0.2123 0.0248 170.45', '0.9439 0.0102 164.86', '0.2616 0.0309 170.40', '0.3062 0.0342 170.68', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2393 0.0298 170.08', '0.9297 0.0128 164.78'),
    }),
    'neon-electric': makePreset({
        id: 'neon-electric',
        name: 'Neon Electric',
        description: 'High-energy neon with electric vibes',
        emoji: '?',
        accents: accents(neonPrimary, INK, neonAccent, INK, neonPrimary, neonAccent, neonPrimary, '0.9680 0.2110 109.77', '0.6702 0.2462 356.40', '0.8664 0.2948 142.50', neonAccent, NEON_FOREGROUND, neonPrimary, WHITE, neonAccent),
        light: surface('0.9704 0.0165 317.74', '0.2190 0.0511 313.56', '0.9905 0.0047 317.76', '0.9298 0.0222 317.72', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9637 0.0142 317.74', '0.2984 0.0597 313.78'),
        dark: surface('0.1782 0.0404 313.61', '0.9503 0.0095 317.75', '0.2190 0.0511 313.56', '0.2589 0.0574 313.64', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.1982 0.0488 313.46', '0.9169 0.0159 317.73'),
    }),
    'royal-velvet': makePreset({
        id: 'royal-velvet',
        name: 'Royal Velvet',
        description: 'Luxurious deep purples with gold accents',
        emoji: '??',
        accents: accents(royalPrimary, WHITE, royalAccent, ROYAL_FOREGROUND, '0.6 0.16 270', royalAccent, royalPrimary, '0.6131 0.2458 328.07', HSL_CHART_YELLOW, '0.5901 0.2198 356.82', '0.8309 0.1622 87.87', ROYAL_FOREGROUND, '0.5524 0.2038 303.26', WHITE, royalPrimary),
        light: surface('0.9702 0.0120 308.32', '0.2134 0.0491 305.71', '0.9903 0.0036 308.42', '0.9287 0.0176 308.25', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9628 0.0116 308.33', '0.2921 0.0574 306.18'),
        dark: surface('0.1755 0.0347 306.16', '0.9491 0.0088 308.36', '0.2158 0.0433 306.12', '0.2559 0.0476 306.31', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.1946 0.0421 305.91', '0.9149 0.0147 308.28'),
    }),
} as const satisfies Record<string, ThemePreset>;
