'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PermissionResource } from '@/server/types/security-types';

import { createPermissionResourceAction, type PermissionResourceCreateState } from '../permission-resource-actions';
import { defaultCreateValues } from '../permission-resource-form-utils';
import { extractLegacyKeys } from '../permission-resource-utils';
import { FieldError } from './field-error';
import { PermissionResourceRow } from './permission-resource-row';

const initialCreateState: PermissionResourceCreateState = {
    status: 'idle',
    values: defaultCreateValues,
};

type SortOption = 'resource' | 'updated' | 'actions';

export function PermissionResourceManager(props: { resources: PermissionResource[] }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(createPermissionResourceAction, initialCreateState);
    const [query, setQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('resource');
    const formReference = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (!pending && state.status === 'success') {
            router.refresh();
            formReference.current?.reset();
        }
    }, [pending, router, state.status]);

    const resourceError = state.fieldErrors?.resource;
    const actionsError = state.fieldErrors?.actions;
    const descriptionError = state.fieldErrors?.description;

    const message =
        state.status === 'error'
            ? state.message
            : state.status === 'success'
                ? state.message
                : null;

    const actionOptions = useMemo(() => {
        const set = new Set<string>();
        for (const resource of props.resources) {
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
    }, [props.resources]);

    const filteredResources = useMemo(() => {
        const search = query.trim().toLowerCase();
        const selectedActions = new Set(actionFilter);

        return props.resources.filter((resource) => {
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
    }, [actionFilter, props.resources, query]);

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

    const totalCount = props.resources.length;
    const filteredCount = sortedResources.length;
    const missingDescriptions = props.resources.filter((resource) => {
        return !resource.description || resource.description.trim().length === 0;
    }).length;
    const hasFilters = query.trim().length > 0 || actionFilter.length > 0;

    const clearFilters = () => {
        setQuery('');
        setActionFilter([]);
    };

    return (
        <div className="space-y-6">
            <form
                ref={formReference}
                action={action}
                className="space-y-4 rounded-xl border bg-[hsl(var(--muted)/0.2)] p-4"
                aria-busy={pending}
            >
                <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Add resource</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Use dot-notation keys that align with your ABAC policies.
                    </p>
                </div>

                <fieldset disabled={pending} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="permission-resource-name">Resource key</Label>
                        <Input
                            id="permission-resource-name"
                            name="resource"
                            required
                            placeholder="hr.leave.request"
                            key={`permission-resource-name-${state.values.resource}`}
                            defaultValue={state.values.resource}
                            className="font-mono"
                            aria-invalid={Boolean(resourceError)}
                            aria-describedby={resourceError ? 'permission-resource-name-error' : undefined}
                        />
                        <FieldError id="permission-resource-name-error" message={resourceError} />
                        <p className="text-xs text-muted-foreground">Example: hr.leave.request</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="permission-resource-actions">Allowed actions</Label>
                        <Textarea
                            id="permission-resource-actions"
                            name="actions"
                            required
                            rows={4}
                            placeholder={'read\nlist\ncreate\nupdate\ndelete'}
                            key={`permission-resource-actions-${state.values.actions}`}
                            defaultValue={state.values.actions}
                            className="font-mono text-xs"
                            aria-invalid={Boolean(actionsError)}
                            aria-describedby={actionsError ? 'permission-resource-actions-error' : undefined}
                        />
                        <FieldError id="permission-resource-actions-error" message={actionsError} />
                        <p className="text-xs text-muted-foreground">
                            Separate actions with commas or new lines.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="permission-resource-description">Description</Label>
                        <Textarea
                            id="permission-resource-description"
                            name="description"
                            rows={3}
                            placeholder="Optional context for admins."
                            key={`permission-resource-description-${state.values.description}`}
                            defaultValue={state.values.description}
                            aria-invalid={Boolean(descriptionError)}
                            aria-describedby={
                                descriptionError ? 'permission-resource-description-error' : undefined
                            }
                        />
                        <FieldError
                            id="permission-resource-description-error"
                            message={descriptionError}
                        />
                    </div>
                </fieldset>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" size="sm" disabled={pending}>
                        {pending ? <Spinner className="mr-2" /> : null}
                        {pending ? 'Creating...' : 'Create resource'}
                    </Button>
                    {message ? (
                        <p
                            className={
                                state.status === 'error'
                                    ? 'text-xs text-destructive'
                                    : 'text-xs text-muted-foreground'
                            }
                            role="status"
                            aria-live="polite"
                        >
                            {message}
                        </p>
                    ) : null}
                </div>
            </form>

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
                            <PermissionResourceRow key={resource.id} resource={resource} />
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
