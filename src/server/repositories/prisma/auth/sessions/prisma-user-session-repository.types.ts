import type { Prisma, SessionStatus } from '@prisma/client';

export interface UserSessionFilters {
    userId?: string;
    sessionId?: string;
    status?: SessionStatus;
    ipAddress?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export type UserSessionCreationData = Prisma.UserSessionUncheckedCreateInput;

export type UserSessionUpdateData = Prisma.UserSessionUncheckedUpdateInput;
