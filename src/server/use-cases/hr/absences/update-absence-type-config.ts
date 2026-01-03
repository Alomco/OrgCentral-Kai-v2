import { z } from 'zod';

import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AbsenceTypeConfig } from '@/server/types/hr-ops-types';
import { assertPrivilegedOrgAbsenceActor } from '@/server/security/authorization';
import { toJsonValue } from '@/server/domain/absences/conversions';

import { invalidateAbsenceScopeCache } from './cache-helpers';

const updateAbsenceTypeSchema = z.object({
    typeId: z.uuid(),
    label: z.string().trim().min(2).max(120),
    tracksBalance: z.boolean(),
    isActive: z.boolean(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export interface UpdateAbsenceTypeConfigDependencies {
    typeConfigRepository: IAbsenceTypeConfigRepository;
}

export interface UpdateAbsenceTypeConfigInput {
    authorization: RepositoryAuthorizationContext;
    payload: z.input<typeof updateAbsenceTypeSchema>;
}

export interface UpdateAbsenceTypeConfigResult {
    type: AbsenceTypeConfig;
}

export async function updateAbsenceTypeConfig(
    deps: UpdateAbsenceTypeConfigDependencies,
    input: UpdateAbsenceTypeConfigInput,
): Promise<UpdateAbsenceTypeConfigResult> {
    assertPrivilegedOrgAbsenceActor(input.authorization);

    const parsed = updateAbsenceTypeSchema.safeParse(input.payload);
    if (!parsed.success) {
        throw new ValidationError('Invalid absence type update payload.', {
            issues: parsed.error.issues,
        });
    }

    const existing = await deps.typeConfigRepository.getConfig(
        input.authorization.orgId,
        parsed.data.typeId,
    );

    if (!existing) {
        throw new EntityNotFoundError('Absence type', { id: parsed.data.typeId });
    }

    const updated = await deps.typeConfigRepository.updateConfig(
        input.authorization.orgId,
        parsed.data.typeId,
        {
            label: parsed.data.label.trim(),
            tracksBalance: parsed.data.tracksBalance,
            isActive: parsed.data.isActive,
            metadata: toJsonValue(parsed.data.metadata),
        },
    );

    await invalidateAbsenceScopeCache(input.authorization);

    return { type: updated };
}
