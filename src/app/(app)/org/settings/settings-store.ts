import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    loadOrgSettings,
    updateOrgSettings,
    ORG_SETTINGS_CACHE_SCOPE,
    type OrgSettings,
} from '@/server/services/org/settings/org-settings-store';

export { updateOrgSettings, ORG_SETTINGS_CACHE_SCOPE };

export async function getOrgSettingsForUi(
    authorization: RepositoryAuthorizationContext,
): Promise<OrgSettings> {
    async function loadCached(input: RepositoryAuthorizationContext): Promise<OrgSettings> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            input.orgId,
            ORG_SETTINGS_CACHE_SCOPE,
            input.dataClassification,
            input.dataResidency,
        );

        return loadOrgSettings(input.orgId);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadOrgSettings(authorization.orgId);
    }

    return loadCached(authorization);
}
