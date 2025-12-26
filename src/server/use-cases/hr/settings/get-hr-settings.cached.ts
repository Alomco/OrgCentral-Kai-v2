import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { IHRSettingsRepository } from '@/server/repositories/contracts/hr/settings/hr-settings-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { HRSettings } from '@/server/types/hr-ops-types';
import { PrismaHRSettingsRepository } from '@/server/repositories/prisma/hr/settings';
import { getHrSettings } from './get-hr-settings';
import { registerHrSettingsCacheTag } from './cache-helpers';

export interface GetHrSettingsCachedInput {
    authorization: RepositoryAuthorizationContext;
    orgId: string;
}

export interface GetHrSettingsCachedResult {
    settings: HRSettings;
}

function resolveHrSettingsRepository(): IHRSettingsRepository {
    return new PrismaHRSettingsRepository();
}

export async function getHrSettingsForUi(input: GetHrSettingsCachedInput): Promise<GetHrSettingsCachedResult> {
    async function getHrSettingsCached(
        cachedInput: GetHrSettingsCachedInput,
    ): Promise<GetHrSettingsCachedResult> {
        'use cache';
        cacheLife('minutes');

        registerHrSettingsCacheTag(cachedInput.authorization);

        const result = await getHrSettings(
            { hrSettingsRepository: resolveHrSettingsRepository() },
            cachedInput,
        );
        return { settings: result.settings };
    }

    // Compliance rule: sensitive data is never cached.
    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const result = await getHrSettings(
            { hrSettingsRepository: resolveHrSettingsRepository() },
            input,
        );
        return { settings: result.settings };
    }

    return getHrSettingsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
