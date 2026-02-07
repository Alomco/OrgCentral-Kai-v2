import { buildOrganizationServiceDependencies } from '@/server/repositories/providers/org/organization-service-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ORG_SETTINGS } from '@/server/repositories/cache-scopes';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PrismaInputJsonObject, PrismaJsonValue } from '@/server/types/prisma';
import { normalizeOrgSettings, type OrgSettings } from './org-settings-model';

export type { OrgSettings } from './org-settings-model';

export const ORG_SETTINGS_CACHE_SCOPE = CACHE_SCOPE_ORG_SETTINGS;

const { organizationRepository } = buildOrganizationServiceDependencies();

export async function loadOrgSettings(orgId: string): Promise<OrgSettings> {
    const settings = await organizationRepository.getOrganizationSettings(orgId);
    const normalizedInput = settings as unknown as PrismaJsonValue | null | undefined;
    return normalizeOrgSettings(normalizedInput ?? {});
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

    const settingsJson: PrismaInputJsonObject = {
        invites: { ...nextSettings.invites },
        security: {
            ...nextSettings.security,
            ipAllowlist: [...nextSettings.security.ipAllowlist],
        },
        notifications: { ...nextSettings.notifications },
        billing: { ...nextSettings.billing },
    };

    await organizationRepository.updateOrganizationSettings(authorization.orgId, settingsJson);

    await invalidateOrgCache(
        authorization.orgId,
        ORG_SETTINGS_CACHE_SCOPE,
        authorization.dataClassification,
        authorization.dataResidency,
    );
}
