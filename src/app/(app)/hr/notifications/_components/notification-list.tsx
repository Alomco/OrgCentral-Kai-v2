'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { NotificationSummary } from '@/components/notifications/notification-item';
import { deleteHrNotification, listHrNotifications, markHrNotificationRead } from '../actions';
import type { NotificationFilters } from '../_schemas/filter-schema';
import { buildHrNotificationsQueryKey, HR_NOTIFICATIONS_QUERY_KEY } from '../notification-query';
import { NotificationRow } from './notification-row';

interface NotificationListProps {
  initialNotifications: NotificationSummary[];
  initialUnreadCount: number;
  filters: NotificationFilters;
}

export function NotificationList({
  initialNotifications,
  initialUnreadCount,
  filters,
}: NotificationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => buildHrNotificationsQueryKey(filters), [filters]);
  const { data } = useQuery({
    queryKey,
    queryFn: () => listHrNotifications(filters),
    initialData: { notifications: initialNotifications, unreadCount: initialUnreadCount },
  });

  const notifications = data.notifications;
  const totalUnreadCount = data.unreadCount;
  const unreadInResults = notifications.filter((notification) => !notification.isRead).length;
  const totalCount = notifications.length;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const hasSelection = selectedIds.size > 0;
  const hasFilters = Boolean(filters.q ?? filters.type ?? filters.priority ?? (filters.unreadOnly ?? false));

  const updateNotifications = useCallback((updater: (items: NotificationSummary[]) => NotificationSummary[]) => {
    queryClient.setQueryData<{ notifications: NotificationSummary[]; unreadCount: number }>(
      queryKey,
      (current) => {
        if (!current) {
          return current;
        }
        const nextNotifications = updater(current.notifications);
        const unreadCount = nextNotifications.filter((item) => !item.isRead).length;
        return { ...current, notifications: nextNotifications, unreadCount };
      },
    );
  }, [queryClient, queryKey]);

  const bulkReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id) => markHrNotificationRead({ notificationId: id })),
      );
      return { ids, results };
    },
    onSuccess: ({ ids, results }) => {
      const succeeded = ids.filter((_, index) => results[index].success);
      if (succeeded.length === 0) {
        toast.error('Failed to mark notifications as read');
        return;
      }
      const succeededSet = new Set(succeeded);
      updateNotifications((items) => items.map((item) => (
        succeededSet.has(item.id) ? { ...item, isRead: true } : item
      )));
      toast.success(`${String(succeeded.length)} notifications marked as read`);
      void queryClient.invalidateQueries({ queryKey: HR_NOTIFICATIONS_QUERY_KEY }).catch(() => null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id) => deleteHrNotification({ notificationId: id })),
      );
      return { ids, results };
    },
    onSuccess: ({ ids, results }) => {
      const succeeded = ids.filter((_, index) => results[index].success);
      if (succeeded.length === 0) {
        toast.error('Failed to delete notifications');
        return;
      }
      const succeededSet = new Set(succeeded);
      updateNotifications((items) => items.filter((item) => !succeededSet.has(item.id)));
      toast.success(`${String(succeeded.length)} notifications deleted`);
      void queryClient.invalidateQueries({ queryKey: HR_NOTIFICATIONS_QUERY_KEY }).catch(() => null);
    },
  });

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (current.size === notifications.length) {
        return new Set();
      }
      return new Set(notifications.map((notification) => notification.id));
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkRead = () => {
    if (selectedIds.size === 0) {
      return;
    }

    bulkReadMutation.mutate(Array.from(selectedIds), {
      onSettled: () => setSelectedIds(new Set()),
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }

    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSettled: () => setSelectedIds(new Set()),
    });
  };

  const handleItemRead = useCallback((id: string) => {
    updateNotifications((items) => items.map((item) => (
      item.id === id ? { ...item, isRead: true } : item
    )));
  }, [updateNotifications]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card/40 py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">You&apos;re all caught up</p>
        <p className="text-sm">No notifications match these filters.</p>
        {hasFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/hr/notifications')}
            className="mt-2 h-8"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 px-2" role="status" aria-live="polite">
          <Checkbox
            checked={selectedIds.size === notifications.length && notifications.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground">
            Selected {selectedIds.size} of {totalCount}
          </span>
          <span className="text-xs text-muted-foreground">
            Unread in results {unreadInResults}
          </span>
          <span className="text-xs text-muted-foreground">
            Unread total {totalUnreadCount}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasSelection ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRead}
                disabled={bulkReadMutation.isPending || bulkDeleteMutation.isPending}
                className="h-8"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkReadMutation.isPending || bulkDeleteMutation.isPending}
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className="space-y-2"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 720px' }}
      >
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            selected={selectedIds.has(notification.id)}
            onToggle={() => toggleSelect(notification.id)}
            onRead={handleItemRead}
          />
        ))}
      </div>
    </div>
  );
}
