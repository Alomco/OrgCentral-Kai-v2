import type { HslValue } from './tokens';
import {
    accents,
    GALAXY_FOREGROUND,
    makePreset,
    surface,
    TANGERINE_FOREGROUND,
    WHITE,
} from './theme-presets.shared';
import type { ThemePreset } from './theme-presets.shared';

const infernoPrimary: HslValue = '355 85% 55%';
const cherryPrimary: HslValue = '340 75% 60%';
const galaxyPrimary: HslValue = '230 80% 50%';
const tangerinePrimary: HslValue = '35 95% 58%';
const tangerineAccent: HslValue = '25 92% 55%';
const rubyPrimary: HslValue = '350 80% 50%';

export const themePresetsGroupB = {
    'inferno-red': makePreset({
        id: 'inferno-red',
        name: 'Inferno Red',
        description: 'Bold reds with fiery orange highlights',
        emoji: '??',
        accents: accents(infernoPrimary, WHITE, '20 90% 55%', WHITE, infernoPrimary, infernoPrimary, '20 90% 55%', '35 85% 50%', '10 80% 50%', '45 75% 55%', '355 85% 60%', WHITE, '20 85% 60%', WHITE, infernoPrimary),
        light: surface('350 80% 97%', '350 40% 12%', '350 70% 99%', '350 35% 92%', '350 20% 45%', '350 30% 86%', '350 45% 96%', '350 30% 20%'),
        dark: surface('350 40% 8%', '350 20% 94%', '350 35% 12%', '350 30% 16%', '350 18% 65%', '350 25% 22%', '350 40% 10%', '350 20% 90%'),
    }),
    'cherry-blossom': makePreset({
        id: 'cherry-blossom',
        name: 'Cherry Blossom',
        description: 'Soft pinks with spring freshness',
        emoji: '??',
        accents: accents(cherryPrimary, WHITE, '320 70% 58%', WHITE, cherryPrimary, cherryPrimary, '320 70% 58%', '350 65% 55%', '300 60% 50%', '330 68% 52%', '340 75% 65%', WHITE, '320 70% 63%', WHITE, cherryPrimary),
        light: surface('340 80% 97%', '340 40% 12%', '340 70% 99%', '340 35% 92%', '340 20% 45%', '340 30% 86%', '340 45% 96%', '340 30% 20%'),
        dark: surface('340 40% 8%', '340 20% 94%', '340 35% 12%', '340 30% 16%', '340 18% 65%', '340 25% 22%', '340 40% 10%', '340 20% 90%'),
    }),
    'galaxy-indigo': makePreset({
        id: 'galaxy-indigo',
        name: 'Galaxy Indigo',
        description: 'Deep cosmic indigo with starlight highlights',
        emoji: '??',
        accents: accents(galaxyPrimary, WHITE, '250 90% 65%', WHITE, galaxyPrimary, galaxyPrimary, '250 90% 65%', '210 85% 55%', '270 75% 60%', '200 80% 50%', '230 80% 55%', WHITE, '250 85% 70%', GALAXY_FOREGROUND, galaxyPrimary),
        light: surface('230 60% 97%', '230 45% 12%', '230 50% 99%', '230 35% 92%', '230 20% 45%', '230 30% 86%', '230 40% 96%', '230 30% 20%'),
        dark: surface('230 40% 8%', '230 20% 94%', '230 35% 12%', '230 30% 16%', '230 18% 65%', '230 25% 22%', '230 40% 10%', '230 20% 90%'),
    }),
    'tangerine-dream': makePreset({
        id: 'tangerine-dream',
        name: 'Tangerine Dream',
        description: 'Vibrant orange with fresh citrus energy',
        emoji: '??',
        accents: accents(tangerinePrimary, TANGERINE_FOREGROUND, tangerineAccent, WHITE, tangerinePrimary, tangerinePrimary, tangerineAccent, '45 90% 50%', '15 88% 52%', '50 85% 55%', '35 95% 63%', TANGERINE_FOREGROUND, '25 90% 60%', WHITE, tangerinePrimary),
        light: surface('35 85% 97%', '20 50% 12%', '35 80% 99%', '35 40% 92%', '30 20% 45%', '35 35% 86%', '35 60% 96%', '30 35% 20%'),
        dark: surface('30 40% 8%', '35 20% 94%', '30 35% 12%', '30 30% 16%', '35 18% 65%', '30 25% 22%', '30 40% 10%', '35 20% 90%'),
    }),
    'ruby-matrix': makePreset({
        id: 'ruby-matrix',
        name: 'Ruby Matrix',
        description: 'Professional ruby red with digital energy',
        emoji: '??',
        accents: accents(rubyPrimary, WHITE, '5 75% 52%', WHITE, rubyPrimary, rubyPrimary, '5 75% 52%', '340 75% 55%', '10 78% 50%', '330 72% 52%', '350 80% 55%', WHITE, '5 75% 57%', WHITE, rubyPrimary),
        light: surface('350 70% 97%', '350 40% 12%', '350 60% 99%', '350 35% 92%', '350 20% 45%', '350 30% 86%', '350 40% 96%', '350 30% 20%'),
        dark: surface('350 40% 8%', '350 20% 94%', '350 35% 12%', '350 30% 16%', '350 18% 65%', '350 25% 22%', '350 40% 10%', '350 20% 90%'),
    }),
} as const satisfies Record<string, ThemePreset>;
