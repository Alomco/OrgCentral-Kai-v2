import { themePresetsGroupA } from './theme-presets.group-a';
import { themePresetsGroupB } from './theme-presets.group-b';
import type { ThemePreset } from './theme-presets.shared';

export const themePresets = {
    ...themePresetsGroupA,
    ...themePresetsGroupB,
} as const satisfies Record<string, ThemePreset>;
