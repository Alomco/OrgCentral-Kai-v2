import type { Prisma } from '../../../../../generated/client';

export interface NotificationPreferenceFilters {
    orgId?: string;
    userId?: string;
    channel?: string;
    enabled?: boolean;
}

export type NotificationPreferenceCreationData = Prisma.NotificationPreferenceUncheckedCreateInput;

export type NotificationPreferenceUpdateData = Prisma.NotificationPreferenceUncheckedUpdateInput;
