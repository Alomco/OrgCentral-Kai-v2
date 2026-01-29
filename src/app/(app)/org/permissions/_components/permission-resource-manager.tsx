'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { listPermissionResourcesQuery } from './permissions.api';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PermissionResource } from '@/server/types/security-types';

import { extractLegacyKeys } from '../permission-resource-utils';
import { PermissionResourceCreateForm } from './permission-resource-create-form';
import { PermissionResourceRow } from './permission-resource-row';

type SortOption = 'resource' | 'updated' | 'actions';

export function PermissionResourceManager(props: { orgId: string; resources: PermissionResource[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
    const [actionFilter, setActionFilter] = useState<string[]>(() => {
        const actions = searchParams.get('actions');
        return actions ? actions.split(',').filter(Boolean) : [];
    });
    const [sortBy, setSortBy] = useState<SortOption>(() => {
        const value = searchParams.get('sort');
        if (value === 'resource' || value === 'updated' || value === 'actions') {
            return value;
        }
        return 'resource';
    });

    const { data } = useQuery({ ...listPermissionResourcesQuery(props.orgId), initialData: props.resources });
    const liveResources = data ?? [];

    const actionOptions = useMemo(() => {
        const set = new Set<string>();
        for (const resource of liveResources) {
            if (!Array.isArray(resource.actions)) {
                continue;
            }
            for (const action of resource.actions) {
                const trimmed = action.trim();
                if (trimmed.length > 0) {
                    set.add(trimmed);
                }
            }
        }
        return Array.from(set).sort((left, right) => left.localeCompare(right));
    }, [liveResources]);

    const filteredResources = useMemo(() => {
        const search = query.trim().toLowerCase();
        const selectedActions = new Set(actionFilter);

        return liveResources.filter((resource) => {
            const actions = Array.isArray(resource.actions) ? resource.actions : [];
            const matchesActions =
                selectedActions.size === 0 ||
                Array.from(selectedActions).every((action) => actions.includes(action));

            if (!matchesActions) {
                return false;
            }

            if (!search) {
                return true;
            }

            const legacyKeys = extractLegacyKeys(resource);
            const haystack = [
                resource.resource,
                resource.description ?? '',
                ...actions,
                ...legacyKeys,
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(search);
        });
    }, [actionFilter, liveResources, query]);

    const sortedResources = useMemo(() => {
        const resources = [...filteredResources];

        if (sortBy === 'updated') {
            resources.sort((left, right) => {
                const leftTime = toTimestamp(left.updatedAt);
                const rightTime = toTimestamp(right.updatedAt);
                if (rightTime !== leftTime) {
                    return rightTime - leftTime;
                }
                return left.resource.localeCompare(right.resource);
            });
            return resources;
        }

        if (sortBy === 'actions') {
            resources.sort((left, right) => {
                const leftCount = Array.isArray(left.actions) ? left.actions.length : 0;
                const rightCount = Array.isArray(right.actions) ? right.actions.length : 0;
                if (rightCount !== leftCount) {
                    return rightCount - leftCount;
                }
                return left.resource.localeCompare(right.resource);
            });
            return resources;
        }

        resources.sort((left, right) => left.resource.localeCompare(right.resource));
        return resources;
    }, [filteredResources, sortBy]);

    const totalCount = liveResources.length;
    const filteredCount = sortedResources.length;
    const missingDescriptions = props.resources.filter((resource) => {
        return !resource.description || resource.description.trim().length === 0;
    }).length;
    const hasFilters = query.trim().length > 0 || actionFilter.length > 0;

    const clearFilters = () => {
        setQuery('');
        setActionFilter([]);
    };

    useEffect(() => {
        const params = new URLSearchParams();
        if (query) {
            params.set('q', query);
        }
        if (actionFilter.length > 0) {
            params.set('actions', actionFilter.join(','));
        }
        if (sortBy !== 'resource') {
            params.set('sort', sortBy);
        }
        const nextQuery = params.toString();
        const currentQuery = searchParams.toString();
        if (nextQuery !== currentQuery) {
            const href = nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
            router.replace(href, { scroll: false });
        }
    }, [actionFilter, pathname, query, router, searchParams, sortBy]);

    return (
        <div className="space-y-6">
            <PermissionResourceCreateForm orgId={props.orgId} />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">Registered resources</p>
                        <p className="text-xs text-muted-foreground">
                            Showing {filteredCount} of {totalCount}.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search resources or actions"
                            className="h-9 w-60"
                            aria-label="Search permission resources"
                        />
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                            <SelectTrigger className="h-9 w-[170px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="resource">A to Z</SelectItem>
                                <SelectItem value="updated">Recently updated</SelectItem>
                                <SelectItem value="actions">Most actions</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                onClick={clearFilters}
                            >
                                <X className="mr-1 h-4 w-4" />
                                Clear
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{totalCount} total</Badge>
                    <Badge variant="outline">{actionOptions.length} unique actions</Badge>
                    <Badge variant="outline">{missingDescriptions} missing descriptions</Badge>
                    {hasFilters ? <Badge variant="secondary">{filteredCount} matching</Badge> : null}
                </div>

                {actionOptions.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Filter by action</p>
                        <ToggleGroup
                            type="multiple"
                            value={actionFilter}
                            onValueChange={setActionFilter}
                            variant="outline"
                            size="sm"
                            className="w-full flex-wrap gap-2"
                            aria-label="Filter resources by action"
                        >
                            {actionOptions.map((actionOption) => (
                                <ToggleGroupItem key={actionOption} value={actionOption}>
                                    {actionOption}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                ) : null}

                {sortedResources.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        <p>
                            {totalCount === 0
                                ? 'No permission resources defined yet.'
                                : 'No permission resources match your filters.'}
                        </p>
                        {hasFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={clearFilters}
                            >
                                Clear filters
                            </Button>
                        ) : null}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedResources.map((resource) => (
                            <PermissionResourceRow key={resource.id} orgId={props.orgId} resource={resource} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function toTimestamp(value: Date | string): number {
    const dateValue = value instanceof Date ? value : new Date(value);
    const time = dateValue.getTime();
    return Number.isNaN(time) ? 0 : time;
}
