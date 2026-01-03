import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ABSENCES } from '@/server/repositories/cache-scopes';
import { assertPrivilegedOrgAbsenceActor } from '@/server/security/authorization';

export interface ListAbsenceTypeConfigsDependencies {
    typeConfigRepository: IAbsenceTypeConfigRepository;
}

export interface ListAbsenceTypeConfigsInput {
    authorization: RepositoryAuthorizationContext;
    includeInactive?: boolean;
}

export interface ListAbsenceTypeConfigsResult {
    types: AbsenceTypeConfig[];
}

export async function listAbsenceTypeConfigs(
    deps: ListAbsenceTypeConfigsDependencies,
    input: ListAbsenceTypeConfigsInput,
): Promise<ListAbsenceTypeConfigsResult> {
    if (input.includeInactive) {
        assertPrivilegedOrgAbsenceActor(input.authorization);
    }

    registerOrgCacheTag(
        input.authorization.orgId,
        CACHE_SCOPE_ABSENCES,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    const types = await deps.typeConfigRepository.getConfigs(
        input.authorization.orgId,
        { includeInactive: input.includeInactive },
    );

    return { types };
}
