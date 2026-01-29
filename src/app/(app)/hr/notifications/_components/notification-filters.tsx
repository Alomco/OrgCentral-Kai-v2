'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { X } from 'lucide-react';

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
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="w-64">
        <Input aria-label="Search notifications" placeholder="Search" defaultValue={q} onChange={(e)=>updateFilters('q', e.target.value.trim().length>0 ? e.target.value : null)} disabled={isPending} className="h-9" />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="unread-mode"
          checked={unreadOnly}
          onCheckedChange={(checked) => updateFilters('unreadOnly', checked ? 'true' : null)}
          disabled={isPending}
        />
        <Label htmlFor="unread-mode">Unread only</Label>
      </div>

      <Select
        value={currentType ?? 'all'}
        onValueChange={(value) => updateFilters('type', value === 'all' ? null : value)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px] h-9">
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

      <Select
        value={currentPriority ?? 'all'}
        onValueChange={(value) => updateFilters('priority', value === 'all' ? null : value)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[150px] h-9">
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

      {hasFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="h-9 px-2 text-muted-foreground hover:text-foreground"
          disabled={isPending}
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
