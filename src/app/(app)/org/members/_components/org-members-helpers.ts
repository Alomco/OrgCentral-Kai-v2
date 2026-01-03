export type OrgMemberStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type OrgMemberSortKey = 'name' | 'email' | 'status' | 'role';
export type OrgMemberSortDirection = 'asc' | 'desc';

export interface OrgMembersQuery {
    search: string;
    status?: OrgMemberStatus;
    role?: string;
    sort: OrgMemberSortKey;
    direction: OrgMemberSortDirection;
    page: number;
    pageSize: number;
}

export type OrgMembersSearchParams = Record<string, string | string[] | undefined>;

export const ORG_MEMBERS_DEFAULTS = {
    search: '',
    sort: 'name' as OrgMemberSortKey,
    direction: 'asc' as OrgMemberSortDirection,
    page: 1,
    pageSize: 25,
};

export const ORG_MEMBER_STATUS_VALUES: OrgMemberStatus[] = [
    'INVITED',
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED',
];

export const ORG_MEMBERS_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const ORG_MEMBER_SORT_KEYS: OrgMemberSortKey[] = ['name', 'email', 'status', 'role'];
export const ORG_MEMBER_SORT_DIRECTIONS: OrgMemberSortDirection[] = ['asc', 'desc'];

function firstParameter(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

function parseNumber(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

function normalizeOptionalValue(value?: string): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
}

function normalizePage(value: number): number {
    return value > 0 ? Math.floor(value) : ORG_MEMBERS_DEFAULTS.page;
}

function normalizePageSize(value: number): number {
    const candidate = Math.floor(value);
    return ORG_MEMBERS_PAGE_SIZE_OPTIONS.includes(candidate as (typeof ORG_MEMBERS_PAGE_SIZE_OPTIONS)[number])
        ? candidate
        : ORG_MEMBERS_DEFAULTS.pageSize;
}

export function parseOrgMembersQuery(params: OrgMembersSearchParams): OrgMembersQuery {
    const search = normalizeSearch(firstParameter(params.q));
    const status = parseEnum(firstParameter(params.status), ORG_MEMBER_STATUS_VALUES);
    const role = normalizeOptionalValue(firstParameter(params.role));
    const sort =
        parseEnum(firstParameter(params.sort), ORG_MEMBER_SORT_KEYS) ??
        ORG_MEMBERS_DEFAULTS.sort;
    const direction =
        parseEnum(firstParameter(params.dir), ORG_MEMBER_SORT_DIRECTIONS) ??
        ORG_MEMBERS_DEFAULTS.direction;
    const page = normalizePage(parseNumber(firstParameter(params.page), ORG_MEMBERS_DEFAULTS.page));
    const pageSize = normalizePageSize(
        parseNumber(firstParameter(params.pageSize), ORG_MEMBERS_DEFAULTS.pageSize),
    );

    return {
        search,
        status,
        role,
        sort,
        direction,
        page,
        pageSize,
    };
}

export function buildOrgMembersSearchParams(query: OrgMembersQuery): URLSearchParams {
    const params = new URLSearchParams();

    if (query.search) {
        params.set('q', query.search);
    }
    if (query.status) {
        params.set('status', query.status);
    }
    if (query.role) {
        params.set('role', query.role);
    }
    if (query.sort !== ORG_MEMBERS_DEFAULTS.sort) {
        params.set('sort', query.sort);
    }
    if (query.direction !== ORG_MEMBERS_DEFAULTS.direction) {
        params.set('dir', query.direction);
    }
    if (query.page !== ORG_MEMBERS_DEFAULTS.page) {
        params.set('page', String(query.page));
    }
    if (query.pageSize !== ORG_MEMBERS_DEFAULTS.pageSize) {
        params.set('pageSize', String(query.pageSize));
    }

    return params;
}

export function buildOrgMembersHref(
    base: OrgMembersQuery,
    overrides?: Partial<OrgMembersQuery>,
): string {
    const merged: OrgMembersQuery = {
        ...base,
        ...overrides,
    };
    const params = buildOrgMembersSearchParams(merged);
    const query = params.toString();
    return query.length > 0 ? `/org/members?${query}` : '/org/members';
}
