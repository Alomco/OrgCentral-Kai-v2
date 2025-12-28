import { EntityNotFoundError } from '@/server/errors';
import { AbsenceAlreadyClosedError } from '@/server/errors/hr-absences';
import type { IAbsenceTypeConfigRepository } from '@/server/repositories/contracts/hr/absences/absence-type-config-repository-contract';
import type { IUnplannedAbsenceRepository } from '@/server/repositories/contracts/hr/absences/unplanned-absence-repository-contract';
import type { ILeaveBalanceRepository } from '@/server/repositories/contracts/hr/leave/leave-balance-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertPrivilegedOrgAbsenceActor } from '@/server/security/authorization';
import type { CancelAbsencePayload } from '@/server/types/hr-absence-schemas';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import { normalizeString } from '@/server/use-cases/shared';
import {
    coerceAbsenceMetadata,
    mergeMetadata,
    mutateAbsenceMetadata,
    type LeaveBalanceAdjustment,
} from '@/server/domain/absences/metadata';
import { toNumber } from '@/server/domain/absences/conversions';
import type { LeaveBalance } from '@/server/types/leave-types';
import { invalidateAbsenceScopeCache } from './cache-helpers';

export interface CancelUnplannedAbsenceDependencies {
    absenceRepository: IUnplannedAbsenceRepository;
    typeConfigRepository: IAbsenceTypeConfigRepository;
    leaveBalanceRepository: ILeaveBalanceRepository;
}

export interface CancelUnplannedAbsenceInput {
    authorization: RepositoryAuthorizationContext;
    absenceId: string;
    payload: CancelAbsencePayload;
}

export interface CancelUnplannedAbsenceResult {
    absence: UnplannedAbsence;
}

export async function cancelUnplannedAbsence(
    deps: CancelUnplannedAbsenceDependencies,
    input: CancelUnplannedAbsenceInput,
): Promise<CancelUnplannedAbsenceResult> {
    assertPrivilegedOrgAbsenceActor(input.authorization);

    const orgId = input.authorization.orgId;
    const absence = await deps.absenceRepository.getAbsence(orgId, input.absenceId);
    if (!absence) {
        throw new EntityNotFoundError('Unplanned absence', { id: input.absenceId });
    }
    if (absence.status === 'CANCELLED') {
        throw new AbsenceAlreadyClosedError({ absenceId: input.absenceId, status: absence.status });
    }

    const absenceType = await deps.typeConfigRepository.getConfig(orgId, absence.typeId);
    if (!absenceType) {
        throw new EntityNotFoundError('Absence type', { id: absence.typeId });
    }

    const cancellationReason = normalizeString(input.payload.reason) ?? input.payload.reason.trim();
    const metadata = mutateAbsenceMetadata(absence.metadata, (store) => {
        store.cancellation = {
            reason: cancellationReason,
            cancelledByUserId: input.authorization.userId,
            cancelledAt: new Date().toISOString(),
        };
        mergeMetadata(store, input.payload.metadata);
    });

    const updated = await deps.absenceRepository.updateAbsence(orgId, absence.id, {
        status: 'CANCELLED',
        metadata,
    });

    if (absenceType.tracksBalance) {
        await restoreLeaveBalances(deps, input.authorization, updated);
    }

    await invalidateAbsenceScopeCache(input.authorization);
    return { absence: updated };
}

async function restoreLeaveBalances(
    deps: CancelUnplannedAbsenceDependencies,
    authorization: RepositoryAuthorizationContext,
    absence: UnplannedAbsence,
): Promise<void> {
    const adjustments = (coerceAbsenceMetadata(absence.metadata).leaveBalanceAdjustments ?? []).filter(
        isLeaveBalanceAdjustment,
    );

    if (adjustments.length === 0) {
        return;
    }

    const fallbackHours = Math.max(0, toNumber(absence.hours as number | { toNumber(): number } | undefined));

    await Promise.all(
        adjustments.map(async (entry) => {
            const balanceHours = typeof entry.hours === 'number' ? entry.hours : fallbackHours;
            if (!balanceHours || balanceHours <= 0) {
                return;
            }

            const balance = await deps.leaveBalanceRepository.getLeaveBalance(authorization.tenantScope, entry.balanceId);
            if (!balance) {
                return;
            }
            await deps.leaveBalanceRepository.updateLeaveBalance(
                authorization.tenantScope,
                balance.id,
                buildBalanceUpdate(balance, entry.category ?? 'used', balanceHours),
            );
        }),
    );
}

function buildBalanceUpdate(balance: LeaveBalance, category: 'used' | 'pending', hours: number) {
    const used = category === 'used' ? Math.max(0, (balance.used || 0) - hours) : balance.used;
    const pending = category === 'pending' ? Math.max(0, (balance.pending || 0) - hours) : balance.pending;
    const available = Math.max(0, (balance.totalEntitlement || 0) - used - pending);
    return {
        used,
        pending,
        available,
        updatedAt: new Date(),
    };
}

function isLeaveBalanceAdjustment(value: unknown): value is LeaveBalanceAdjustment {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value as Record<string, unknown>;
    const balanceId = candidate.balanceId;
    if (typeof balanceId !== 'string') {
        return false;
    }
    const category = candidate.category;
    if (category !== undefined && category !== 'used' && category !== 'pending') {
        return false;
    }
    const hours = candidate.hours;
    if (hours !== undefined && typeof hours !== 'number') {
        return false;
    }
    return true;
}
