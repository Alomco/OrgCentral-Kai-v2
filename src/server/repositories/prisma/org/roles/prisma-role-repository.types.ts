import type { Prisma } from '../../../../../generated/client';

export interface RoleFilters {
    orgId?: string;
    scope?: string;
}

export type RoleCreationData = Prisma.RoleUncheckedCreateInput;

export type RoleUpdateData = Prisma.RoleUncheckedUpdateInput;
