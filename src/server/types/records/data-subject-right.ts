import type { JsonValue } from '@/server/types/json';

export interface DataSubjectRight {
    id: string;
    orgId: string;
    userId: string | null;
    rightType: string;
    status: string;
    requestDate: Date;
    dueDate: Date;
    completedAt?: Date | null;
    responseDate?: Date | null;
    dataSubjectInfo?: JsonValue;
    response?: string | null;
    responseFrom?: string | null;
    notes?: string | null;
    metadata?: JsonValue;
    createdAt: Date;
    updatedAt: Date;
}

export interface DataSubjectRightFilters {
    orgId?: string;
    userId?: string;
    rightType?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface DataSubjectRightCreationData {
    orgId: string;
    userId?: string;
    rightType: string;
    status?: string;
    requestDate?: Date;
    dueDate: Date;
    dataSubjectInfo?: Record<string, JsonValue> | JsonValue;
    response?: string;
    responseFrom?: string;
    notes?: string;
    metadata?: Record<string, JsonValue> | JsonValue;
}

export interface DataSubjectRightUpdateData {
    status?: string;
    completedAt?: Date;
    responseDate?: Date;
    response?: string;
    responseFrom?: string;
    notes?: string;
    metadata?: Record<string, JsonValue> | JsonValue;
}
