import type { Prisma, PrismaClient } from '@prisma/client';
import type { IThemeRepository } from '@/server/repositories/contracts/org/theme/theme-repository-contract';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { OrgThemeSettings } from '@/server/types/theme-types';
import { getModelDelegate } from '@/server/repositories/prisma/helpers/prisma-utils';

type OrganizationDelegate = PrismaClient['organization'];
type OrganizationUpdateData = Parameters<OrganizationDelegate['update']>[0]['data'];

function normalizeSettings(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as Record<string, unknown>;
}

function normalizeTheme(value: unknown): OrgThemeSettings {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as OrgThemeSettings;
}

/**
 * Convert theme settings to JSON-safe format for Prisma
 */
function themeToJson(theme: OrgThemeSettings): Record<string, unknown> {
    return {
        presetId: theme.presetId,
        customOverrides: theme.customOverrides,
        updatedAt: theme.updatedAt?.toISOString(),
    };
}

export class PrismaThemeRepository extends BasePrismaRepository implements IThemeRepository {
    private delegate(): OrganizationDelegate {
        return getModelDelegate(this.prisma, 'organization');
    }

    async getTheme(orgId: string): Promise<OrgThemeSettings | null> {
        const record = await this.delegate().findUnique({
            where: { id: orgId },
            select: { settings: true, updatedAt: true },
        });

        if (!record) {
            return null;
        }

        const settings = normalizeSettings(record.settings);
        const themeData = normalizeTheme(settings.theme);

        if (!Object.keys(themeData).length) {
            return null;
        }

        return {
            ...themeData,
            updatedAt: record.updatedAt,
        };
    }

    async updateTheme(orgId: string, updates: Partial<OrgThemeSettings>): Promise<OrgThemeSettings> {
        const existing = await this.delegate().findUnique({
            where: { id: orgId },
            select: { settings: true, updatedAt: true },
        });

        const currentSettings = normalizeSettings(existing?.settings);
        const currentTheme = normalizeTheme(currentSettings.theme);

        // Merge updates with current theme
        const nextTheme: OrgThemeSettings = {
            ...currentTheme,
            ...updates,
            updatedAt: new Date(),
        };

        const data: OrganizationUpdateData = {
            settings: {
                ...currentSettings,
                theme: themeToJson(nextTheme),
            } as unknown as Prisma.InputJsonValue,
        };

        const record = await this.delegate().update({
            where: { id: orgId },
            data,
            select: { settings: true, updatedAt: true },
        });

        const savedSettings = normalizeSettings(record.settings);
        const savedTheme = normalizeTheme(savedSettings.theme);

        return {
            ...savedTheme,
            updatedAt: record.updatedAt,
        };
    }

    async resetTheme(orgId: string): Promise<void> {
        const existing = await this.delegate().findUnique({
            where: { id: orgId },
            select: { settings: true },
        });

        const currentSettings = normalizeSettings(existing?.settings);
        const { theme: _removed, ...rest } = currentSettings;
        void _removed;

        const data: OrganizationUpdateData = {
            settings: rest as Prisma.InputJsonValue,
        };

        await this.delegate().update({
            where: { id: orgId },
            data,
        });
    }
}
