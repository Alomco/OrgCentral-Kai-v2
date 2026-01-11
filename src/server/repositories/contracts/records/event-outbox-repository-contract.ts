import type { JsonValue } from '@/server/types/json';
import type { EventOutboxRecord, EventOutboxFilters, EventOutboxCreationData, EventOutboxUpdateData } from '@/server/types/records/event-outbox';

export interface IEventOutboxRepository {
    findById(id: string): Promise<EventOutboxRecord | null>;
    findAll(filters?: EventOutboxFilters): Promise<EventOutboxRecord[]>;
    findPendingEvents(limit?: number): Promise<EventOutboxRecord[]>;
    findFailedEvents(limit?: number): Promise<EventOutboxRecord[]>;
    create(data: EventOutboxCreationData): Promise<EventOutboxRecord>;
    update(id: string, data: EventOutboxUpdateData): Promise<EventOutboxRecord>;
    markAsProcessing(id: string): Promise<EventOutboxRecord>;
    markAsProcessed(id: string): Promise<EventOutboxRecord>;
    markAsFailed(id: string, error?: JsonValue | null): Promise<EventOutboxRecord>;
    delete(id: string): Promise<EventOutboxRecord>;
    cleanupProcessedEvents(orgId: string, olderThan: Date): Promise<number>;
}
