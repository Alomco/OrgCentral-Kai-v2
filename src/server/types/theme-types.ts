import type { ThemeTokenMap } from '@/server/theme/tokens';
import type { UiStyleKey } from '@/server/theme/ui-style-presets';

/**
 * Organization theme settings stored in settings.theme JSON field
 */
export interface OrgThemeSettings {
    /** Selected theme preset ID */
    presetId?: string;
    /** Custom color overrides (OKLCH format) */
    customOverrides?: Partial<ThemeTokenMap>;
    /** Default UI style preset */
    uiStyleId?: UiStyleKey;
    /** Last updated timestamp */
    updatedAt?: Date;
}

/**
 * Record shape for theme data stored in Organization.settings
 */
export interface OrgThemeRecord {
    orgId: string;
    theme: OrgThemeSettings | null;
    updatedAt: Date;
}
