import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import { PrismaAbsenceTypeConfigRepository } from '@/server/repositories/prisma/hr/absences';

import { listAbsenceTypeConfigs } from './list-absence-type-configs';

export interface ListAbsenceTypeConfigsForUiInput {
    authorization: RepositoryAuthorizationContext;
    includeInactive?: boolean;
}

export interface ListAbsenceTypeConfigsForUiResult {
    types: AbsenceTypeConfig[];
}

function resolveRepository() {
    return new PrismaAbsenceTypeConfigRepository();
}

export async function listAbsenceTypeConfigsForUi(
    input: ListAbsenceTypeConfigsForUiInput,
): Promise<ListAbsenceTypeConfigsForUiResult> {
    async function listCached(
        cachedInput: ListAbsenceTypeConfigsForUiInput,
    ): Promise<ListAbsenceTypeConfigsForUiResult> {
        'use cache';
        cacheLife('minutes');

        const result = await listAbsenceTypeConfigs(
            { typeConfigRepository: resolveRepository() },
            cachedInput,
        );

        return { types: result.types };
    }

    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const result = await listAbsenceTypeConfigs(
            { typeConfigRepository: resolveRepository() },
            input,
        );
        return { types: result.types };
    }

    return listCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
