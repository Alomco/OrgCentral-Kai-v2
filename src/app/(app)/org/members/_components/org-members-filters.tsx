import {
    ORG_MEMBER_STATUS_VALUES,
    ORG_MEMBER_SORT_DIRECTIONS,
    ORG_MEMBER_SORT_KEYS,
    ORG_MEMBERS_PAGE_SIZE_OPTIONS,
    type OrgMemberStatus,
    type OrgMembersQuery,
} from './org-members-helpers';

const MEMBER_STATUS_LABELS: Record<OrgMemberStatus, string> = {
    INVITED: 'Invited',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    DEACTIVATED: 'Deactivated',
};

const SORT_LABELS: Record<(typeof ORG_MEMBER_SORT_KEYS)[number], string> = {
    name: 'Name',
    email: 'Email',
    status: 'Status',
    role: 'Role',
};

const DIRECTION_LABELS: Record<(typeof ORG_MEMBER_SORT_DIRECTIONS)[number], string> = {
    asc: 'Ascending',
    desc: 'Descending',
};

export function OrgMembersFilters({
    query,
    roleNames,
}: {
    query: OrgMembersQuery;
    roleNames: string[];
}) {
    return (
        <form
            method="get"
            className="flex flex-col gap-3 border-b border-[hsl(var(--border)/0.6)] pb-4 md:flex-row md:items-end md:flex-wrap"
        >
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Search
                <input
                    type="search"
                    name="q"
                    defaultValue={query.search}
                    placeholder="Search by name or email"
                    className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Status
                <select
                    name="status"
                    defaultValue={query.status ?? ''}
                    className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                >
                    <option value="">All statuses</option>
                    {ORG_MEMBER_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>
                            {MEMBER_STATUS_LABELS[status]}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Role
                <select
                    name="role"
                    defaultValue={query.role ?? ''}
                    className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                >
                    <option value="">All roles</option>
                    {roleNames.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Sort by
                <select
                    name="sort"
                    defaultValue={query.sort}
                    className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                >
                    {ORG_MEMBER_SORT_KEYS.map((key) => (
                        <option key={key} value={key}>
                            {SORT_LABELS[key]}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Direction
                <select
                    name="dir"
                    defaultValue={query.direction}
                    className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                >
                    {ORG_MEMBER_SORT_DIRECTIONS.map((direction) => (
                        <option key={direction} value={direction}>
                            {DIRECTION_LABELS[direction]}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Page size
                <select
                    name="pageSize"
                    defaultValue={String(query.pageSize)}
                    className="h-9 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
                >
                    {ORG_MEMBERS_PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                            {size} per page
                        </option>
                    ))}
                </select>
            </label>
            <input type="hidden" name="page" value="1" />
            <button
                type="submit"
                className="h-9 w-fit rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))]"
            >
                Apply
            </button>
        </form>
    );
}
