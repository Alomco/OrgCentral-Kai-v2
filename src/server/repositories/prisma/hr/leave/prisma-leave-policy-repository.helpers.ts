import type {
  LeavePolicyType as PrismaLeavePolicyType,
  LeaveAccrualFrequency as PrismaLeaveAccrualFrequency,
} from '../../../../../generated/client';

import type { LeavePolicy } from '@/server/types/leave-types';
import type { LeavePolicyUpdateData } from './prisma-leave-policy-repository.types';

function hasOwnProperty(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/** Copy defined simple fields from updates to normalized output */
function copyDefinedFields(
  updates: Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>,
  normalized: Partial<LeavePolicyUpdateData>,
): void {
  if (updates.name !== undefined) { normalized.name = updates.name; }
  if (updates.policyType !== undefined) { normalized.policyType = updates.policyType as PrismaLeavePolicyType; }
  if (updates.accrualFrequency !== undefined) { normalized.accrualFrequency = updates.accrualFrequency as PrismaLeaveAccrualFrequency; }
  if (updates.requiresApproval !== undefined) { normalized.requiresApproval = updates.requiresApproval; }
  if (updates.isDefault !== undefined) { normalized.isDefault = updates.isDefault; }
  if (updates.statutoryCompliance !== undefined) { normalized.statutoryCompliance = updates.statutoryCompliance; }
  if (updates.allowNegativeBalance !== undefined) { normalized.allowNegativeBalance = updates.allowNegativeBalance; }
  if (updates.dataClassification !== undefined) { normalized.dataClassification = updates.dataClassification; }
  if (updates.dataResidency !== undefined) { normalized.residencyTag = updates.dataResidency; }
  if (updates.auditSource !== undefined) { normalized.auditSource = updates.auditSource; }
  if (updates.auditBatchId !== undefined) { normalized.auditBatchId = updates.auditBatchId; }
  if (updates.metadata !== undefined) { normalized.metadata = updates.metadata; }
  if (updates.activeFrom !== undefined) { normalized.activeFrom = new Date(updates.activeFrom); }
}

/** Copy nullable fields that may be explicitly set to null/undefined */
function copyNullableFields(
  updates: Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>,
  normalized: Partial<LeavePolicyUpdateData>,
): void {
  if (hasOwnProperty(updates, 'departmentId')) { normalized.departmentId = updates.departmentId; }
  if (hasOwnProperty(updates, 'accrualAmount')) { normalized.accrualAmount = updates.accrualAmount; }
  if (hasOwnProperty(updates, 'carryOverLimit')) { normalized.carryOverLimit = updates.carryOverLimit; }
  if (hasOwnProperty(updates, 'maxConsecutiveDays')) { normalized.maxConsecutiveDays = updates.maxConsecutiveDays; }

  if (hasOwnProperty(updates, 'activeTo')) {
    const activeTo = updates.activeTo;
    if (activeTo === undefined) {
      normalized.activeTo = undefined;
    } else if (activeTo === null) {
      normalized.activeTo = null;
    } else {
      normalized.activeTo = new Date(activeTo);
    }
  }
}

export function normalizeLeavePolicyUpdates(
  updates: Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>,
): Partial<LeavePolicyUpdateData> {
  const normalized: Partial<LeavePolicyUpdateData> = {};
  copyDefinedFields(updates, normalized);
  copyNullableFields(updates, normalized);
  return normalized;
}
