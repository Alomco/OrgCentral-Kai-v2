import {
    EMPLOYMENT_STATUS_VALUES,
    EMPLOYMENT_TYPE_VALUES,
    type EmploymentStatusCode,
    type EmploymentTypeCode,
} from '@/server/types/hr/people';

export type EmployeeDirectorySortKey = 'name' | 'startDate' | 'status' | 'jobTitle';
export type EmployeeDirectorySortDirection = 'asc' | 'desc';

export interface EmployeeDirectoryQuery {
    search: string;
    status?: EmploymentStatusCode;
    employmentType?: EmploymentTypeCode;
    departmentId?: string;
    managerUserId?: string;
    startDate?: string;
    endDate?: string;
    sort: EmployeeDirectorySortKey;
    direction: EmployeeDirectorySortDirection;
    page: number;
    pageSize: number;
}

export type EmployeeDirectorySearchParams = Record<string, string | string[] | undefined>;

export const EMPLOYEE_DIRECTORY_DEFAULTS = {
    sort: 'name' as EmployeeDirectorySortKey,
    direction: 'asc' as EmployeeDirectorySortDirection,
    page: 1,
    pageSize: 25,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function firstParameter(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

function normalizeSearch(value?: string): string {
    return value?.trim() ?? '';
}

function parseEnum<TValues extends readonly string[]>(
    value: string | undefined,
    allowed: TValues,
): TValues[number] | undefined {
    if (!value) {
        return undefined;
    }
    return allowed.includes(value) ? (value as TValues[number]) : undefined;
}

function parseNumber(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePage(value: number): number {
    return value > 0 ? Math.floor(value) : EMPLOYEE_DIRECTORY_DEFAULTS.page;
}

function normalizePageSize(value: number): number {
    const candidate = Math.floor(value);
    return PAGE_SIZE_OPTIONS.includes(candidate as (typeof PAGE_SIZE_OPTIONS)[number])
        ? candidate
        : EMPLOYEE_DIRECTORY_DEFAULTS.pageSize;
}

export function parseEmployeeDirectoryQuery(
    params: EmployeeDirectorySearchParams,
): EmployeeDirectoryQuery {
    const search = normalizeSearch(firstParameter(params.q));
    const status = parseEnum(firstParameter(params.status), EMPLOYMENT_STATUS_VALUES);
    const employmentType = parseEnum(firstParameter(params.type), EMPLOYMENT_TYPE_VALUES);
    const departmentId = normalizeSearch(firstParameter(params.department));
    const managerUserId = normalizeSearch(firstParameter(params.manager));
    const startDate = normalizeSearch(firstParameter(params.start));
    const endDate = normalizeSearch(firstParameter(params.end));
    const sort =
        parseEnum(firstParameter(params.sort), ['name', 'startDate', 'status', 'jobTitle'] as const) ??
        EMPLOYEE_DIRECTORY_DEFAULTS.sort;
    const direction =
        parseEnum(firstParameter(params.dir), ['asc', 'desc'] as const) ??
        EMPLOYEE_DIRECTORY_DEFAULTS.direction;

    const page = normalizePage(parseNumber(firstParameter(params.page), EMPLOYEE_DIRECTORY_DEFAULTS.page));
    const pageSize = normalizePageSize(
        parseNumber(firstParameter(params.pageSize), EMPLOYEE_DIRECTORY_DEFAULTS.pageSize),
    );

    return {
        search,
        status,
        employmentType,
        departmentId: departmentId || undefined,
        managerUserId: managerUserId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sort,
        direction,
        page,
        pageSize,
    };
}

export function parseEmployeeDirectoryQueryFromSearchParams(
    searchParams: URLSearchParams,
): EmployeeDirectoryQuery {
    const params: EmployeeDirectorySearchParams = {};

    for (const [key, value] of searchParams.entries()) {
        const existing = params[key];
        if (Array.isArray(existing)) {
            params[key] = [...existing, value];
        } else if (typeof existing === 'string') {
            params[key] = [existing, value];
        } else {
            params[key] = value;
        }
    }

    return parseEmployeeDirectoryQuery(params);
}

export function buildEmployeeDirectorySearchParams(query: EmployeeDirectoryQuery): URLSearchParams {
    const params = new URLSearchParams();

    if (query.search) {
        params.set('q', query.search);
    }
    if (query.status) {
        params.set('status', query.status);
    }
    if (query.employmentType) {
        params.set('type', query.employmentType);
    }
    if (query.departmentId) {
        params.set('department', query.departmentId);
    }
    if (query.managerUserId) {
        params.set('manager', query.managerUserId);
    }
    if (query.startDate) {
        params.set('start', query.startDate);
    }
    if (query.endDate) {
        params.set('end', query.endDate);
    }
    if (query.sort !== EMPLOYEE_DIRECTORY_DEFAULTS.sort) {
        params.set('sort', query.sort);
    }
    if (query.direction !== EMPLOYEE_DIRECTORY_DEFAULTS.direction) {
        params.set('dir', query.direction);
    }
    if (query.page !== EMPLOYEE_DIRECTORY_DEFAULTS.page) {
        params.set('page', String(query.page));
    }
    if (query.pageSize !== EMPLOYEE_DIRECTORY_DEFAULTS.pageSize) {
        params.set('pageSize', String(query.pageSize));
    }

    return params;
}

export function buildEmployeeDirectoryHref(
    base: EmployeeDirectoryQuery,
    overrides?: Partial<EmployeeDirectoryQuery>,
): string {
    const merged: EmployeeDirectoryQuery = {
        ...base,
        ...overrides,
    };
    const params = buildEmployeeDirectorySearchParams(merged);
    const query = params.toString();
    return query.length > 0 ? `/hr/employees?${query}` : '/hr/employees';
}

export function buildEmployeeDirectoryExportHref(query: EmployeeDirectoryQuery): string {
    const params = buildEmployeeDirectorySearchParams({
        ...query,
        page: EMPLOYEE_DIRECTORY_DEFAULTS.page,
        pageSize: EMPLOYEE_DIRECTORY_DEFAULTS.pageSize,
    });
    const queryString = params.toString();
    return queryString.length > 0 ? `/hr/employees/export?${queryString}` : '/hr/employees/export';
}
