import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import {
    buildEmployeeDirectoryHref,
    type EmployeeDirectoryQuery,
} from './employee-directory-helpers';

interface PageWindowEntry {
    type: 'page' | 'ellipsis';
    value?: number;
}

function buildPageWindow(current: number, total: number): PageWindowEntry[] {
    if (total <= 1) {
        return [{ type: 'page', value: 1 }];
    }

    const pages = new Set<number>([1, total, current - 1, current, current + 1]);
    const sorted = Array.from(pages)
        .filter((page) => page >= 1 && page <= total)
        .toSorted((a, b) => a - b);

    const window: PageWindowEntry[] = [];
    let previous = 0;

    for (const page of sorted) {
        if (page - previous > 1) {
            window.push({ type: 'ellipsis' });
        }
        window.push({ type: 'page', value: page });
        previous = page;
    }

    return window;
}

export interface EmployeesDirectoryPaginationProps {
    query: EmployeeDirectoryQuery;
    totalCount: number;
    rangeStart: number;
    rangeEnd: number;
    pageCount: number;
}

export function EmployeesDirectoryPagination({
    query,
    totalCount,
    rangeStart,
    rangeEnd,
    pageCount,
}: EmployeesDirectoryPaginationProps) {
    if (totalCount === 0) {
        return null;
    }

    const previousPage = query.page > 1 ? query.page - 1 : null;
    const nextPage = query.page < pageCount ? query.page + 1 : null;
    const pageWindow = buildPageWindow(query.page, pageCount);

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-muted-foreground">
                Showing {rangeStart}-{rangeEnd} of {totalCount}
            </div>
            {pageCount > 1 ? (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={previousPage ? buildEmployeeDirectoryHref(query, { page: previousPage }) : '#'}
                                aria-disabled={!previousPage}
                                className={!previousPage ? 'pointer-events-none opacity-50' : undefined}
                            />
                        </PaginationItem>
                        {pageWindow.map((entry, index) => (
                            <PaginationItem key={`${entry.type}-${String(entry.value ?? index)}`}>
                                {entry.type === 'ellipsis' ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink
                                        href={buildEmployeeDirectoryHref(query, { page: entry.value ?? 1 })}
                                        isActive={entry.value === query.page}
                                    >
                                        {entry.value}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                href={nextPage ? buildEmployeeDirectoryHref(query, { page: nextPage }) : '#'}
                                aria-disabled={!nextPage}
                                className={!nextPage ? 'pointer-events-none opacity-50' : undefined}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            ) : null}
        </div>
    );
}
