import { type z } from 'zod';

import { ValidationError } from '@/server/errors';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import { assertPrivilegedOrgAbsenceActor } from '@/server/security/authorization';
import { toJsonValue } from '@/server/domain/absences/conversions';
import { absenceTypeInputSchema } from '@/server/types/hr-absence-schemas';

import { invalidateAbsenceScopeCache } from './cache-helpers';

export interface CreateAbsenceTypeConfigDependencies {
    typeConfigRepository: IAbsenceTypeConfigRepository;
}

export interface CreateAbsenceTypeConfigInput {
    authorization: RepositoryAuthorizationContext;
    payload: z.input<typeof absenceTypeInputSchema> & {
        isActive?: boolean;
    };
}

export interface CreateAbsenceTypeConfigResult {
    type: AbsenceTypeConfig;
}

function buildKeyFromLabel(label: string): string {
    const normalized = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64)
        .replace(/-+$/g, '');
    return normalized;
}

export async function createAbsenceTypeConfig(
    deps: CreateAbsenceTypeConfigDependencies,
    input: CreateAbsenceTypeConfigInput,
): Promise<CreateAbsenceTypeConfigResult> {
    assertPrivilegedOrgAbsenceActor(input.authorization);

    const parsed = absenceTypeInputSchema.safeParse(input.payload);
    if (!parsed.success) {
        throw new ValidationError('Invalid absence type payload.', {
            issues: parsed.error.issues,
        });
    }

    const providedKey = parsed.data.key?.trim();
    const key = providedKey && providedKey.length > 0 ? providedKey : buildKeyFromLabel(parsed.data.label);
    if (!key) {
        throw new ValidationError('Absence type key could not be derived from the label.');
    }

    const existing = await deps.typeConfigRepository.getConfigByKey(
        input.authorization.orgId,
        key,
    );
    if (existing) {
        throw new ValidationError('An absence type with this key already exists.');
    }

    const created = await deps.typeConfigRepository.createConfig(
        input.authorization.orgId,
        {
            orgId: input.authorization.orgId,
            key,
            label: parsed.data.label.trim(),
            tracksBalance: parsed.data.tracksBalance,
            isActive: input.payload.isActive ?? true,
            metadata: toJsonValue(parsed.data.metadata),
        },
    );

    await invalidateAbsenceScopeCache(input.authorization);

    return { type: created };
}
