import type { HslValue } from './tokens';
import {
    accents,
    HSL_CHART_CYAN,
    HSL_CHART_ORANGE,
    HSL_CHART_YELLOW,
    makePreset,
    NEON_FOREGROUND,
    ROYAL_FOREGROUND,
    surface,
    WHITE,
} from './theme-presets.shared';
import type { ThemePreset } from './theme-presets.shared';

const cyberpunkPrimary: HslValue = '262 83% 58%';
const sunsetPrimary: HslValue = '25 95% 53%';
const sunsetAccent: HslValue = '350 80% 55%';
const forestPrimary: HslValue = '160 84% 39%';
const neonPrimary: HslValue = '280 100% 60%';
const neonAccent: HslValue = '180 100% 50%';
const royalPrimary: HslValue = '270 70% 45%';
const royalAccent: HslValue = '45 90% 50%';

export const themePresetsGroupA = {
    'cyberpunk-purple': makePreset({
        id: 'cyberpunk-purple',
        name: 'Cyberpunk Purple',
        description: 'Vibrant purple and pink with neon accents',
        emoji: '??',
        accents: accents(cyberpunkPrimary, WHITE, '330 81% 60%', WHITE, cyberpunkPrimary, '330 81% 60%', cyberpunkPrimary, HSL_CHART_CYAN, HSL_CHART_YELLOW, HSL_CHART_ORANGE, '262 83% 65%', WHITE, '330 70% 55%', WHITE, cyberpunkPrimary),
        light: surface('262 60% 98%', '262 60% 12%', '262 50% 99%', '262 30% 94%', '262 18% 45%', '262 30% 88%', '262 35% 97%', '262 35% 22%'),
        dark: surface('262 45% 8%', '262 20% 96%', '262 40% 12%', '262 35% 16%', '262 18% 65%', '262 35% 22%', '262 45% 10%', '262 20% 90%'),
    }),
    'ocean-depths': makePreset({
        id: 'ocean-depths',
        name: 'Ocean Depths',
        description: 'Deep blues and cyan with aquatic vibes',
        emoji: '??',
        accents: accents(HSL_CHART_CYAN, WHITE, '175 80% 40%', WHITE, HSL_CHART_CYAN, '175 80% 40%', HSL_CHART_CYAN, '220 90% 56%', HSL_CHART_YELLOW, HSL_CHART_ORANGE, '175 80% 50%', WHITE, '200 90% 45%', WHITE, HSL_CHART_CYAN),
        light: surface('200 60% 98%', '210 45% 12%', '200 50% 99%', '200 35% 93%', '200 18% 45%', '200 30% 88%', '200 40% 97%', '210 35% 20%'),
        dark: surface('205 50% 8%', '200 20% 92%', '205 45% 12%', '205 35% 16%', '200 18% 65%', '205 35% 22%', '205 45% 10%', '200 20% 90%'),
    }),
    'sunset-blaze': makePreset({
        id: 'sunset-blaze',
        name: 'Sunset Blaze',
        description: 'Warm oranges and fiery reds',
        emoji: '??',
        accents: accents(sunsetPrimary, WHITE, sunsetAccent, WHITE, sunsetPrimary, sunsetAccent, sunsetPrimary, '45 93% 47%', HSL_CHART_YELLOW, '0 72% 51%', '25 95% 60%', WHITE, '350 75% 60%', WHITE, sunsetPrimary),
        light: surface('25 85% 97%', '20 55% 12%', '25 80% 99%', '25 60% 92%', '20 30% 45%', '25 45% 86%', '25 70% 96%', '20 40% 20%'),
        dark: surface('20 45% 9%', '25 30% 92%', '22 40% 12%', '24 35% 16%', '24 20% 65%', '24 30% 22%', '22 45% 10%', '24 25% 90%'),
    }),
    'forest-emerald': makePreset({
        id: 'forest-emerald',
        name: 'Forest Emerald',
        description: 'Rich greens with natural energy',
        emoji: '??',
        accents: accents(forestPrimary, WHITE, '120 60% 45%', WHITE, forestPrimary, '120 60% 45%', forestPrimary, '180 70% 40%', HSL_CHART_YELLOW, '90 60% 40%', '160 84% 45%', WHITE, '120 55% 50%', WHITE, forestPrimary),
        light: surface('150 60% 97%', '160 40% 12%', '150 50% 99%', '150 30% 92%', '160 18% 42%', '150 25% 85%', '150 40% 96%', '160 30% 20%'),
        dark: surface('160 40% 8%', '150 20% 92%', '160 35% 12%', '160 30% 16%', '150 18% 65%', '160 25% 22%', '160 40% 10%', '150 20% 90%'),
    }),
    'neon-electric': makePreset({
        id: 'neon-electric',
        name: 'Neon Electric',
        description: 'High-energy neon with electric vibes',
        emoji: '?',
        accents: accents(neonPrimary, WHITE, neonAccent, NEON_FOREGROUND, neonPrimary, neonAccent, neonPrimary, '60 100% 50%', '330 100% 60%', '120 100% 50%', neonAccent, NEON_FOREGROUND, neonPrimary, WHITE, neonAccent),
        light: surface('285 70% 97%', '280 40% 12%', '285 60% 99%', '285 35% 92%', '280 20% 45%', '285 30% 86%', '285 45% 96%', '280 30% 20%'),
        dark: surface('280 45% 8%', '285 20% 94%', '280 40% 12%', '280 35% 16%', '285 20% 65%', '280 30% 22%', '280 45% 10%', '285 20% 90%'),
    }),
    'royal-velvet': makePreset({
        id: 'royal-velvet',
        name: 'Royal Velvet',
        description: 'Luxurious deep purples with gold accents',
        emoji: '??',
        accents: accents(royalPrimary, WHITE, royalAccent, ROYAL_FOREGROUND, royalPrimary, royalAccent, royalPrimary, '300 60% 50%', HSL_CHART_YELLOW, '330 70% 50%', '45 90% 55%', ROYAL_FOREGROUND, '270 60% 55%', WHITE, royalPrimary),
        light: surface('270 55% 97%', '270 40% 12%', '270 50% 99%', '270 30% 92%', '270 18% 45%', '270 25% 86%', '270 40% 96%', '270 30% 20%'),
        dark: surface('270 40% 8%', '270 20% 94%', '270 35% 12%', '270 30% 16%', '270 18% 65%', '270 25% 22%', '270 40% 10%', '270 20% 90%'),
    }),
} as const satisfies Record<string, ThemePreset>;
