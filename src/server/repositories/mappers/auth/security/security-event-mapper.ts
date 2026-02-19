import { Prisma, type SecurityEvent as PrismaSecurityEvent } from '../../../../../generated/client';
import type { SecurityEvent } from '@/server/types/hr-types';
import type {
    SecurityEventCreationData,
    SecurityEventFilters,
    SecurityEventUpdateData,
} from '../../../prisma/auth/security/security-event-repository.types';

type JsonLike = Prisma.JsonValue | null | undefined;

const isJsonObject = (value: JsonLike): value is Prisma.JsonObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneJsonObject = <TMetadata extends Prisma.JsonObject>(
    value: JsonLike,
    fallback?: TMetadata,
): TMetadata => (
    isJsonObject(value) ? { ...(value as TMetadata) } : (fallback ?? ({} as TMetadata))
);

export const toSecurityEventJson = (value: JsonLike): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => (
    value === null ? (Prisma.JsonNull as Prisma.NullableJsonNullValueInput) : value ?? undefined
);

type ResolutionMetadata = Prisma.JsonObject & { resolutionNotes?: string };

export const upsertResolutionNotes = (value: JsonLike, resolutionNotes: string): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput => {
    const metadata = cloneJsonObject<ResolutionMetadata>(value);
    metadata.resolutionNotes = resolutionNotes;
    return metadata;
};

export function mapToDomain(record: PrismaSecurityEvent): SecurityEvent {
    return {
        id: record.id,
        orgId: record.orgId ?? null,
        userId: record.userId ?? null,
        eventType: record.eventType,
        severity: record.severity,
        description: record.description,
        ipAddress: record.ipAddress ?? null,
        userAgent: record.userAgent ?? null,
        additionalInfo: record.additionalInfo,
        resolved: record.resolved,
        resolvedAt: record.resolvedAt ?? null,
        resolvedBy: record.resolvedBy ?? null,
        createdAt: record.createdAt,
    };
}

export function buildWhereClause(filters?: SecurityEventFilters): Prisma.SecurityEventWhereInput {
    if (!filters) {
        return {};
    }

    const whereClause: Prisma.SecurityEventWhereInput = {};

    if (filters.orgId) {
        whereClause.orgId = filters.orgId;
    }

    if (filters.userId) {
        whereClause.userId = filters.userId;
    }

    if (filters.eventType) {
        whereClause.eventType = filters.eventType;
    }

    if (filters.severity) {
        whereClause.severity = filters.severity;
    }

    if (filters.resolved !== undefined) {
        whereClause.resolved = filters.resolved;
    }

    if (filters.dateFrom || filters.dateTo) {
        whereClause.createdAt = {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        };
    }

    return whereClause;
}

export function toCreationData(
    tenantId: string,
    event: Omit<SecurityEvent, 'id' | 'createdAt'>,
): SecurityEventCreationData {
    return {
        orgId: tenantId,
        userId: event.userId ?? null,
        eventType: event.eventType,
        severity: event.severity,
        description: event.description,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        additionalInfo: toSecurityEventJson(event.additionalInfo),
        resolved: event.resolved,
        resolvedAt: event.resolvedAt ?? null,
        resolvedBy: event.resolvedBy ?? null,
    };
}

export function buildUpdatePayload(
    updates: Partial<Omit<SecurityEvent, 'id' | 'orgId' | 'userId' | 'createdAt'>>,
): SecurityEventUpdateData {
    const payload: SecurityEventUpdateData = {};

    if (updates.description !== undefined) {
        payload.description = updates.description;
    }

    if (updates.ipAddress !== undefined) {
        payload.ipAddress = updates.ipAddress ?? null;
    }

    if (updates.userAgent !== undefined) {
        payload.userAgent = updates.userAgent ?? null;
    }

    if (updates.additionalInfo !== undefined) {
        payload.additionalInfo = toSecurityEventJson(updates.additionalInfo);
    }

    if (updates.resolved !== undefined) {
        payload.resolved = updates.resolved;
    }

    if (updates.resolvedAt !== undefined) {
        payload.resolvedAt = updates.resolvedAt ?? null;
    }

    if (updates.resolvedBy !== undefined) {
        payload.resolvedBy = updates.resolvedBy ?? null;
    }

    return payload;
}
