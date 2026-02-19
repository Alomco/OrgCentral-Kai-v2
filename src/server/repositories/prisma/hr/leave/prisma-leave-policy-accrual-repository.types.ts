export interface LeavePolicyAccrualFilters {
    policyId?: string;
    tenureMonths?: number;
}

import type { Prisma } from '@prisma/client';

export type LeavePolicyAccrualCreationData = Prisma.LeavePolicyAccrualUncheckedCreateInput;

export type LeavePolicyAccrualUpdateData = Prisma.LeavePolicyAccrualUpdateInput;
