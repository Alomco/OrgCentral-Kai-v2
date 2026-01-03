import type { Prisma } from '@prisma/client';

import { prisma } from '@/server/lib/prisma';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { normalizeOrgSettings, type OrgSettings } from './org-settings-model';

export type { OrgSettings } from './org-settings-model';

export const ORG_SETTINGS_CACHE_SCOPE = 'org:settings';

export async function loadOrgSettings(orgId: string): Promise<OrgSettings> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { settings: true },
    });

    return normalizeOrgSettings(org?.settings ?? {});
}

export async function updateOrgSettings(
    authorization: RepositoryAuthorizationContext,
    updates: Partial<OrgSettings>,
): Promise<void> {
    const current = await loadOrgSettings(authorization.orgId);
    const nextSettings: OrgSettings = {
        invites: { ...current.invites, ...(updates.invites ?? {}) },
        security: { ...current.security, ...(updates.security ?? {}) },
        notifications: { ...current.notifications, ...(updates.notifications ?? {}) },
        billing: { ...current.billing, ...(updates.billing ?? {}) },
    };

    const settingsJson: Prisma.InputJsonObject = {
        invites: { ...nextSettings.invites },
        security: {
            ...nextSettings.security,
            ipAllowlist: [...nextSettings.security.ipAllowlist],
        },
        notifications: { ...nextSettings.notifications },
        billing: { ...nextSettings.billing },
    };

    await prisma.organization.update({
        where: { id: authorization.orgId },
        data: { settings: settingsJson },
    });

    await invalidateOrgCache(
        authorization.orgId,
        ORG_SETTINGS_CACHE_SCOPE,
        authorization.dataClassification,
        authorization.dataResidency,
    );
}
