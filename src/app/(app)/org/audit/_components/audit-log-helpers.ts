export const EVENT_TYPES = [
    'ACCESS',
    'DATA_CHANGE',
    'POLICY_CHANGE',
    'AUTH',
    'SYSTEM',
    'COMPLIANCE',
    'SECURITY',
    'DOCUMENT',
    'LEAVE_REQUEST',
    'PAYROLL',
] as const;

export interface AuditLog {
    id: string;
    eventType: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    userId?: string | null;
    createdAt: string;
}

export interface AuditLogResponse {
    logs: AuditLog[];
    nextCursor?: string;
}

export interface AuditFilters {
    eventType?: string;
    action?: string;
    resource?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit: number;
}

export interface TextFilterProps {
    label: string;
    value?: string;
    onChange: (value?: string) => void;
    placeholder?: string;
    type?: string;
}

function isAuditLogResponse(value: unknown): value is AuditLogResponse {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value as { logs?: unknown };
    return Array.isArray(candidate.logs);
}

export function buildAuditParams(filters: AuditFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.eventType) {
        params.set('eventType', filters.eventType);
    }
    if (filters.action) {
        params.set('action', filters.action);
    }
    if (filters.resource) {
        params.set('resource', filters.resource);
    }
    if (filters.userId) {
        params.set('userId', filters.userId);
    }
    if (filters.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
        params.set('dateTo', filters.dateTo);
    }
    params.set('limit', String(filters.limit || 100));
    return params;
}

export function toLimitValue(value: string): number {
    const parsed = Number(value || 100);
    if (Number.isNaN(parsed)) {
        return 100;
    }
    return Math.min(Math.max(parsed, 1), 500);
}

export async function fetchAuditPage(
    orgId: string,
    params: URLSearchParams,
    cursor?: string,
): Promise<AuditLogResponse> {
    const nextParams = new URLSearchParams(params);
    if (cursor) {
        nextParams.set('cursor', cursor);
    }
    const res = await fetch(`/api/org/${orgId}/audit/logs?${nextParams.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to load audit logs');
    }
    const data: unknown = await res.json();
    if (!isAuditLogResponse(data)) {
        throw new Error('Invalid audit log response');
    }
    return data;
}
