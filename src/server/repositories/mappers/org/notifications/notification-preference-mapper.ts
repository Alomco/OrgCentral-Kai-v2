import type {
    NotificationPreference,
    NotificationPreferenceRecord,
} from '@/server/types/hr-types';
import { Prisma, type PrismaInputJsonValue, type PrismaNullableJsonNullValueInput } from '@/server/types/prisma';
import type { Prisma as PrismaClient } from '@prisma/client';

type NotificationPreferenceCreateInput = PrismaClient.NotificationPreferenceUncheckedCreateInput;

const toJsonInput = (
    value: PrismaInputJsonValue | null | undefined,
): PrismaInputJsonValue | PrismaNullableJsonNullValueInput | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return Prisma.JsonNull;
    }
    return value;
};

export function mapPrismaNotificationPreferenceToDomain(record: NotificationPreferenceRecord): NotificationPreference {
    return {
        id: record.id,
        orgId: record.orgId,
        userId: record.userId,
        channel: record.channel,
        enabled: record.enabled,
        quietHours: record.quietHours,
        metadata: record.metadata,
        updatedAt: record.updatedAt,
    };
}

export function mapDomainNotificationPreferenceToPrisma(input: NotificationPreference): NotificationPreferenceCreateInput {
    return {
        orgId: input.orgId,
        userId: input.userId,
        channel: input.channel,
        enabled: input.enabled,
        quietHours: toJsonInput(input.quietHours),
        metadata: toJsonInput(input.metadata),
        updatedAt: input.updatedAt,
    };
}
