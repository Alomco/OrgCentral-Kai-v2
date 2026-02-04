'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HR_NOTIFICATION_TYPE_VALUES, HR_NOTIFICATION_PRIORITY_VALUES } from '@/server/types/hr/notifications';

const TYPE_LABEL_SEPARATOR_REGEX = /-/g;

export function NotificationFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset page on filter change

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }, [router, searchParams]);

  const currentType = searchParams.get('type');
  const currentPriority = searchParams.get('priority');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const clearFilters = () => {
    startTransition(() => {
      router.push('/hr/notifications');
    });
  };

  const q = searchParams.get('q') ?? '';
  const hasFilters = Boolean(currentType) || Boolean(currentPriority) || unreadOnly;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Label htmlFor="notification-search" className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="notification-search"
              type="search"
              aria-label="Search notifications"
              aria-describedby="notification-search-help"
              placeholder="Search by keyword"
              defaultValue={q}
              onChange={(event) => updateFilters('q', event.target.value.trim().length > 0 ? event.target.value : null)}
              disabled={isPending}
              className="h-10 pl-9"
            />
          </div>
          <p id="notification-search-help" className="mt-1 text-xs text-muted-foreground">
            Example: time off, approvals, policy.
          </p>
        </div>

        <div className="lg:col-span-3">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={currentType ?? 'all'}
            onValueChange={(value) => updateFilters('type', value === 'all' ? null : value)}
            disabled={isPending}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {HR_NOTIFICATION_TYPE_VALUES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(TYPE_LABEL_SEPARATOR_REGEX, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select
            value={currentPriority ?? 'all'}
            onValueChange={(value) => updateFilters('priority', value === 'all' ? null : value)}
            disabled={isPending}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {HR_NOTIFICATION_PRIORITY_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end lg:col-span-2">
          <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="unread-mode" className="text-xs text-muted-foreground">Unread only</Label>
              <p className="text-[11px] text-muted-foreground">Show unread updates</p>
            </div>
            <Switch
              id="unread-mode"
              checked={unreadOnly}
              onCheckedChange={(checked) => updateFilters('unreadOnly', checked ? 'true' : null)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Filters update results automatically.</span>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="ml-auto h-8 px-2 text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            <X className="mr-2 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
