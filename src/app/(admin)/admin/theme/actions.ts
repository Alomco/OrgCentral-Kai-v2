'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { PrismaThemeRepository } from '@/server/repositories/prisma/org/theme/prisma-theme-repository';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { resetOrgTheme } from '@/server/use-cases/org/theme/reset-org-theme';
import { updateOrgTheme } from '@/server/use-cases/org/theme/update-org-theme';
import { updateOrgThemeColors } from '@/server/use-cases/org/theme/update-org-theme-colors';
import { getThemePreset, isThemePresetId } from '@/server/theme/theme-presets';
import type { ThemeTokenMap } from '@/server/theme/tokens';
import { appLogger } from '@/server/logging/structured-logger';

export interface UpdateOrgThemeState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const initialThemeState: UpdateOrgThemeState = { status: 'idle' };

const presetSchema = z
    .object({
        presetId: z.string().trim().min(1),
    })
    .strict();

const hslValueSchema = z
    .string()
    .trim()
    // Minimal format validation: "H S% L%".
    .regex(/^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/, 'Invalid HSL format');

const colorsSchema = z
    .object({
        primaryColor: z.union([hslValueSchema, z.literal('')]).optional(),
        accentColor: z.union([hslValueSchema, z.literal('')]).optional(),
    })
    .strict();

/**
 * Get the theme repository instance (uses default Prisma client)
 */
function getThemeRepository(): PrismaThemeRepository {
    return new PrismaThemeRepository();
}

/**
 * Update organization theme preset
 * Called by global admins to change an org's theme
 */
export async function updateOrgThemeAction(
    orgId: string,
    _previousState: UpdateOrgThemeState,
    formData: FormData,
): Promise<UpdateOrgThemeState> {
    void _previousState;
    try {
        const parsed = presetSchema.safeParse({
            presetId: formData.get('presetId') ?? '',
        });

        if (!parsed.success) {
            return { status: 'error', message: 'Theme preset is required' };
        }

        const headerStore = await headers();
        const { authorization } = await getSessionContext(
            {},
            {
                headers: headerStore,
                orgId,
                requiredPermissions: { organization: ['manage'] },
                auditSource: 'ui:admin:theme:update-preset',
            },
        );

        if (authorization.orgId !== orgId) {
            return { status: 'error', message: 'Cross-tenant theme update denied.' };
        }

        const presetId = parsed.data.presetId;

        if (!isThemePresetId(presetId)) {
            return { status: 'error', message: 'Invalid theme preset' };
        }

        const preset = getThemePreset(presetId);

        await updateOrgTheme(
            { themeRepository: getThemeRepository() },
            {
                authorization,
                orgId,
                presetId,
            },
        );

        return { status: 'success', message: `Theme updated to ${preset.name}` };
    } catch (error) {
        appLogger.error('theme.update.failed', {
            orgId,
            error: error instanceof Error ? error.message : String(error),
        });
        return { status: 'error', message: 'Failed to update theme' };
    }
}

/**
 * Update organization theme with custom color overrides
 */
export async function updateOrgThemeColorsAction(
    orgId: string,
    _previousState: UpdateOrgThemeState,
    formData: FormData,
): Promise<UpdateOrgThemeState> {
    void _previousState;
    try {
        const parsed = colorsSchema.safeParse({
            primaryColor: (formData.get('primaryColor') ?? '') as string,
            accentColor: (formData.get('accentColor') ?? '') as string,
        });

        if (!parsed.success) {
            return { status: 'error', message: 'Invalid color input.' };
        }

        const headerStore = await headers();
        const { authorization } = await getSessionContext(
            {},
            {
                headers: headerStore,
                orgId,
                requiredPermissions: { organization: ['manage'] },
                auditSource: 'ui:admin:theme:update-colors',
            },
        );

        if (authorization.orgId !== orgId) {
            return { status: 'error', message: 'Cross-tenant theme update denied.' };
        }

        const primaryColor = parsed.data.primaryColor?.trim() ?? '';
        const accentColor = parsed.data.accentColor?.trim() ?? '';

        const customOverrides: Partial<ThemeTokenMap> = {};

        if (primaryColor) {
            customOverrides.primary = primaryColor as ThemeTokenMap['primary'];
        }

        if (accentColor) {
            customOverrides.accent = accentColor as ThemeTokenMap['accent'];
        }

        if (Object.keys(customOverrides).length === 0) {
            return { status: 'error', message: 'No valid colors provided' };
        }

        await updateOrgThemeColors(
            { themeRepository: getThemeRepository() },
            {
                authorization,
                orgId,
                overrides: customOverrides,
            },
        );

        return { status: 'success', message: 'Custom colors saved' };
    } catch (error) {
        appLogger.error('theme.updateColors.failed', {
            orgId,
            error: error instanceof Error ? error.message : String(error),
        });
        return { status: 'error', message: 'Failed to update colors' };
    }
}

/**
 * Reset organization theme to default
 */
export async function resetOrgThemeAction(
    orgId: string,
    _previousState: UpdateOrgThemeState,
): Promise<UpdateOrgThemeState> {
    void _previousState;
    try {
        const headerStore = await headers();
        const { authorization } = await getSessionContext(
            {},
            {
                headers: headerStore,
                orgId,
                requiredPermissions: { organization: ['manage'] },
                auditSource: 'ui:admin:theme:reset',
            },
        );

        if (authorization.orgId !== orgId) {
            return { status: 'error', message: 'Cross-tenant theme reset denied.' };
        }

        await resetOrgTheme(
            { themeRepository: getThemeRepository() },
            {
                authorization,
                orgId,
            },
        );

        return { status: 'success', message: 'Theme reset to default' };
    } catch (error) {
        appLogger.error('theme.reset.failed', {
            orgId,
            error: error instanceof Error ? error.message : String(error),
        });
        return { status: 'error', message: 'Failed to reset theme' };
    }
}
