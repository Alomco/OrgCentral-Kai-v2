"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { auditKeys } from './audit.api';
import {
  EVENT_TYPES,
  type AuditFilters,
  type AuditLogResponse,
  buildAuditParams,
  fetchAuditPage,
  toLimitValue,
} from './audit-log-helpers';
import { TextFilter } from './audit-log-text-filter';

export function AuditLogClient({ orgId }: { orgId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<AuditFilters>(() => ({
    eventType: searchParams.get('eventType') ?? undefined,
    action: searchParams.get('action') ?? undefined,
    resource: searchParams.get('resource') ?? undefined,
    userId: searchParams.get('userId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    limit: toLimitValue(searchParams.get('limit') ?? '100'),
  }));

  const params = useMemo(() => buildAuditParams(filters), [filters]);

  const queryKey = auditKeys.list(orgId, params.toString());
  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<AuditLogResponse>({
    queryKey,
    queryFn: ({ pageParam }) => fetchAuditPage(orgId, params, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    maxPages: 10,
    gcTime: 2 * 60_000,
  });

  const logs = data ? data.pages.flatMap((page) => page.logs) : [];

  useEffect(() => {
    const nextQuery = buildAuditParams(filters).toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      const nextHref = nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextHref, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

  // Keyboard: press g twice quickly to jump to top
  useEffect(() => {
    let last: number | null = null;
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'g') {
        return;
      }
      const now = Date.now();
      if (last && now - last < 450) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        last = null;
      } else {
        last = now;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="space-y-4">
      <span id="kbd-gg-hint" className="sr-only">
        Keyboard: press g twice to jump to the top.
      </span>
      <div className="rounded-2xl bg-card/60 p-4 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-6">
          <label className="grid gap-1 text-xs">
            <span className="text-muted-foreground">Event Type</span>
            <select
              className="h-8 rounded-md border bg-background px-2"
              value={filters.eventType ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  eventType: event.target.value || undefined,
                }))
              }
              aria-label="Filter by event type"
            >
              <option value="">All</option>
              {EVENT_TYPES.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
                </option>
              ))}
            </select>
          </label>
          <TextFilter
            label="Action"
            value={filters.action}
            onChange={(value) => setFilters((current) => ({ ...current, action: value }))}
            placeholder="permissionResource.update"
          />
          <TextFilter
            label="Resource"
            value={filters.resource}
            onChange={(value) => setFilters((current) => ({ ...current, resource: value }))}
            placeholder="org.permissionResource"
          />
          <TextFilter
            label="User Id"
            value={filters.userId}
            onChange={(value) => setFilters((current) => ({ ...current, userId: value }))}
            placeholder="uuid"
          />
          <TextFilter
            label="From"
            type="date"
            value={filters.dateFrom}
            onChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
          />
          <TextFilter
            label="To"
            type="date"
            value={filters.dateTo}
            onChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Limit</span>
            <input
              className="h-8 w-20 rounded-md border bg-background px-2"
              type="number"
              min={1}
              max={500}
              value={filters.limit}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  limit: toLimitValue(event.target.value),
                }))
              }
            />
          </label>
          <button
            type="button"
            className="rounded-md border px-3 h-8"
            onClick={() => {
              setFilters((current) => ({ ...current }));
              refetch().catch(() => null);
            }}
          >
            Apply
          </button>
          {isFetching ? <span className="text-muted-foreground">Loading...</span> : null}
        </div>
      </div>

      <div className="rounded-2xl bg-card/60 p-4 backdrop-blur">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="px-2 py-1">Time</th>
                  <th className="px-2 py-1">Event</th>
                  <th className="px-2 py-1">Action</th>
                  <th className="px-2 py-1">Resource</th>
                  <th className="px-2 py-1">User</th>
                  <th className="px-2 py-1">Id</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-2 py-1 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1">{log.eventType}</td>
                    <td className="px-2 py-1">{log.action}</td>
                    <td className="px-2 py-1">{log.resource}</td>
                    <td className="px-2 py-1">{log.userId ?? 'N/A'}</td>
                    <td className="px-2 py-1">{log.resourceId ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border px-3 h-8"
            onClick={() => {
              refetch().catch(() => null);
            }}
            aria-label="Refresh"
          >
            Refresh
          </button>
          <button
            type="button"
            className="rounded-md border px-3 h-8"
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => {
              fetchNextPage().catch(() => null);
            }}
            aria-label="Load more audit events"
          >
            {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No More'}
          </button>
          <button
            type="button"
            className="rounded-md border px-3 h-8"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            aria-label="Jump to Top"
            aria-describedby="kbd-gg-hint"
          >
            Top
          </button>
        </div>
      </div>
    </div>
  );
}
