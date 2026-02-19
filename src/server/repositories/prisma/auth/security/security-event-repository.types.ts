import type { Prisma } from '../../../../../generated/client';

export interface SecurityEventFilters {
    orgId?: string;
    userId?: string;
    eventType?: string;
    severity?: string;
    resolved?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

export type SecurityEventCreationData = Prisma.SecurityEventUncheckedCreateInput;

export type SecurityEventUpdateData = Prisma.SecurityEventUncheckedUpdateInput;
