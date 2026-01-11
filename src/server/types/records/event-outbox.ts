import type { JsonValue } from '@/server/types/json';

export interface EventOutboxRecord {
    id: string;
    orgId: string;
    eventType: string;
    payload: JsonValue;
    status: string;
    error?: JsonValue | null;
    availableAt: Date;
    processedAt?: Date | null;
    maxRetries: number;
    retryCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventOutboxFilters {
    orgId?: string;
    eventType?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface EventOutboxCreationData {
    orgId: string;
    eventType: string;
    payload: Record<string, JsonValue> | JsonValue;
    status?: string;
    availableAt?: Date;
}

export interface EventOutboxUpdateData {
    status?: string;
    error?: JsonValue | null;
    processedAt?: Date;
    maxRetries?: number;
    retryCount?: number;
    availableAt?: Date;
}
