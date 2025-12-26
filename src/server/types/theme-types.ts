import type { ThemeTokenMap } from '@/server/theme/tokens';

/**
 * Organization theme settings stored in settings.theme JSON field
 */
export interface OrgThemeSettings {
    /** Selected theme preset ID */
    presetId?: string;
    /** Custom color overrides (HSL format) */
    customOverrides?: Partial<ThemeTokenMap>;
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
