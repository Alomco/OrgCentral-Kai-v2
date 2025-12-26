import type { OrgThemeSettings, OrgThemeRecord } from '@/server/types/theme-types';

/**
 * Repository contract for organization theme persistence
 */
export interface IThemeRepository {
    /**
     * Get theme settings for an organization
     */
    getTheme(orgId: string): Promise<OrgThemeSettings | null>;

    /**
     * Update theme settings for an organization
     */
    updateTheme(orgId: string, updates: Partial<OrgThemeSettings>): Promise<OrgThemeSettings>;

    /**
     * Reset theme to default (removes all customizations)
     */
    resetTheme(orgId: string): Promise<void>;
}

/**
 * Maps raw database record to domain model
 */
export function mapThemeRecordToDomain(record: OrgThemeRecord | null): OrgThemeSettings | null {
    if (!record?.theme) {
        return null;
    }
    return {
        presetId: record.theme.presetId,
        customOverrides: record.theme.customOverrides,
        updatedAt: record.updatedAt,
    };
}
