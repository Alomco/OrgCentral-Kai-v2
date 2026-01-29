'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { PermissionResource } from '@/server/types/security-types';

import { extractLegacyKeys } from '../permission-resource-utils';
import { PermissionResourceDeleteForm } from './permission-resource-delete-form';
import { PermissionResourceUpdateForm } from './permission-resource-update-form';

export function PermissionResourceRow(props: { orgId: string; resource: PermissionResource }) {
    const [open, setOpen] = useState(false);
    const actions = Array.isArray(props.resource.actions) ? [...props.resource.actions] : [];
    actions.sort((left, right) => left.localeCompare(right));

    const legacyKeys = extractLegacyKeys(props.resource);
    const updatedLabel = formatRelativeTime(props.resource.updatedAt);
    const visibleActions = actions.slice(0, 6);
    const extraActionCount = Math.max(actions.length - visibleActions.length, 0);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(props.resource.resource);
            toast.success('Resource key copied.');
        } catch {
            toast.error('Clipboard blocked.');
        }
    };

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="rounded-lg border p-3"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold font-mono text-[oklch(var(--foreground))]">
                            {props.resource.resource}
                        </p>
                        {legacyKeys.length > 0 ? (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                Legacy keys
                            </Badge>
                        ) : null}
                    </div>
                    <p className="text-xs text-[oklch(var(--muted-foreground))]">
                        {props.resource.description ?? 'No description'}
                    </p>
                    {legacyKeys.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {legacyKeys.map((legacyKey) => (
                                <Badge key={legacyKey} variant="outline" className="text-[10px]">
                                    {legacyKey}
                                </Badge>
                            ))}
                        </div>
                    ) : null}
                    {updatedLabel ? (
                        <p className="text-xs text-muted-foreground">
                            Updated {updatedLabel}.
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-1">
                        {visibleActions.length === 0 ? (
                            <Badge variant="outline">No actions</Badge>
                        ) : (
                            visibleActions.map((action) => (
                                <Badge key={`${props.resource.id}-${action}`} variant="secondary">
                                    {action}
                                </Badge>
                            ))
                        )}
                        {extraActionCount > 0 ? (
                            <Badge variant="outline">+{extraActionCount} more</Badge>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCopy}
                            aria-label="Copy resource key"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <CollapsibleTrigger asChild>
                            <Button type="button" size="sm" variant="outline" className="gap-2">
                                {open ? 'Close' : 'Edit'}
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                                />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>
            </div>

            <CollapsibleContent className="mt-3 space-y-3 border-t pt-3">
                <PermissionResourceUpdateForm orgId={props.orgId} resource={props.resource} />
                <PermissionResourceDeleteForm orgId={props.orgId} resourceId={props.resource.id} />
            </CollapsibleContent>
        </Collapsible>
    );
}

function formatRelativeTime(value: Date | string): string | null {
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return null;
    }

    return formatDistanceToNow(dateValue, { addSuffix: true });
}

