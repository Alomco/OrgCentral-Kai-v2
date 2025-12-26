import type {
  Prisma,
  LeavePolicyType as PrismaLeavePolicyType,
  LeaveAccrualFrequency as PrismaLeaveAccrualFrequency,
} from '@prisma/client';

import type { LeavePolicy } from '@/server/types/leave-types';
import type { LeavePolicyUpdateData } from './prisma-leave-policy-repository.types';

function hasOwnProperty(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function normalizeLeavePolicyUpdates(
  updates: Partial<Omit<LeavePolicy, 'id' | 'orgId' | 'createdAt'>>,
): Partial<LeavePolicyUpdateData> {
  const normalized: Partial<LeavePolicyUpdateData> = {};

  const mappings: [
    key: keyof typeof updates,
    apply: (value: (typeof updates)[keyof typeof updates]) => void,
  ][] = [
    ['name', (value) => {
      normalized.name = value as string;
    }],
    ['policyType', (value) => {
      normalized.policyType = value as PrismaLeavePolicyType;
    }],
    ['accrualFrequency', (value) => {
      normalized.accrualFrequency = value as PrismaLeaveAccrualFrequency;
    }],
    ['requiresApproval', (value) => {
      normalized.requiresApproval = value as boolean;
    }],
    ['isDefault', (value) => {
      normalized.isDefault = value as boolean;
    }],
    ['statutoryCompliance', (value) => {
      normalized.statutoryCompliance = value as boolean;
    }],
    ['allowNegativeBalance', (value) => {
      normalized.allowNegativeBalance = value as boolean;
    }],
    ['metadata', (value) => {
      normalized.metadata = value as Prisma.InputJsonValue | Record<string, unknown> | null;
    }],
  ];

  for (const [key, apply] of mappings) {
    const value = updates[key];
    if (value !== undefined) {
      apply(value);
    }
  }

  if (hasOwnProperty(updates, 'departmentId')) {
    normalized.departmentId = updates.departmentId as string | null;
  }

  if (hasOwnProperty(updates, 'accrualAmount')) {
    normalized.accrualAmount = updates.accrualAmount as number | null;
  }

  if (hasOwnProperty(updates, 'carryOverLimit')) {
    normalized.carryOverLimit = updates.carryOverLimit as number | null;
  }

  if (updates.activeFrom !== undefined) {
    normalized.activeFrom =
      typeof updates.activeFrom === 'string'
        ? new Date(updates.activeFrom as unknown as string)
        : (updates.activeFrom as Date);
  }

  if (hasOwnProperty(updates, 'activeTo')) {
    const activeTo = updates.activeTo;
    if (activeTo === undefined) {
      normalized.activeTo = undefined;
    } else if (activeTo === null) {
      normalized.activeTo = null;
    } else if (typeof activeTo === 'string') {
      normalized.activeTo = new Date(activeTo);
    } else {
      normalized.activeTo = activeTo as Date;
    }
  }

  if (hasOwnProperty(updates, 'maxConsecutiveDays')) {
    normalized.maxConsecutiveDays = updates.maxConsecutiveDays as number | null;
  }

  return normalized;
}
