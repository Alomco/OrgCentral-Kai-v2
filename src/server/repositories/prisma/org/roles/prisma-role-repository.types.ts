import type { Prisma } from '@prisma/client';

export interface RoleFilters {
    orgId?: string;
    scope?: string;
}

export type RoleCreationData = Prisma.RoleUncheckedCreateInput;

export type RoleUpdateData = Prisma.RoleUncheckedUpdateInput;
