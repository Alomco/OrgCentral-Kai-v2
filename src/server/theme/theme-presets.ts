import { themePresets } from './theme-presets.catalog';
import type { ThemePreset } from './theme-presets.shared';

export { themePresets, type ThemePreset };

export type ThemePresetId = keyof typeof themePresets;

export const defaultPresetId: ThemePresetId = 'cyberpunk-purple';

export function isThemePresetId(value: string): value is ThemePresetId {
    return Object.prototype.hasOwnProperty.call(themePresets, value);
}

export function getThemePreset(presetId: string): ThemePreset {
    const resolvedId: ThemePresetId = isThemePresetId(presetId) ? presetId : defaultPresetId;
    return themePresets[resolvedId];
}

export interface ThemePresetOption {
    id: string;
    name: string;
    emoji: string;
    description: string;
}

export function getPresetOptions(): ThemePresetOption[] {
    return Object.values(themePresets).map(({ id, name, emoji, description }) => ({
        id,
        name,
        emoji,
        description,
    }));
}
