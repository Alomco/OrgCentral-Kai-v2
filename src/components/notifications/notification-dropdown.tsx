'use client';

import Link from 'next/link';
import { CheckCheck } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem, type NotificationSummary } from './notification-item';
import { markAllHrNotificationsRead } from '@/app/(app)/hr/notifications/actions';
import {
  buildHrNotificationsQueryKey,
  HR_NOTIFICATION_DROPDOWN_FILTERS,
  HR_NOTIFICATIONS_QUERY_KEY,
} from '@/app/(app)/hr/notifications/notification-query';

interface NotificationDropdownProps {
  notifications: NotificationSummary[];
  onClose?: () => void;
}

export function NotificationDropdown({ notifications, onClose }: NotificationDropdownProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const queryKey = buildHrNotificationsQueryKey(HR_NOTIFICATION_DROPDOWN_FILTERS);

  const markAllMutation = useMutation({
    mutationFn: () => markAllHrNotificationsRead(),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.setQueryData<{ notifications: NotificationSummary[]; unreadCount: number }>(
          queryKey,
          (current) => {
            if (!current) {
              return current;
            }
            const nextNotifications = current.notifications.map((notification) => ({
              ...notification,
              isRead: true,
            }));
            return { notifications: nextNotifications, unreadCount: 0 };
          },
        );
        toast.success('All notifications marked as read');
        void queryClient.invalidateQueries({ queryKey: HR_NOTIFICATIONS_QUERY_KEY }).catch(() => null);
      } else {
        toast.error('Failed to mark all as read');
      }
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });

  const handleMarkAllRead = () => {
    startTransition(() => {
      markAllMutation.mutate();
    });
  };

  const handleItemRead = (id: string) => {
    queryClient.setQueryData<{ notifications: NotificationSummary[]; unreadCount: number }>(
      queryKey,
      (current) => {
        if (!current) {
          return current;
        }
        const nextNotifications = current.notifications.map((notification) => (
          notification.id === id ? { ...notification, isRead: true } : notification
        ));
        const unreadCount = nextNotifications.filter((item) => !item.isRead).length;
        return { notifications: nextNotifications, unreadCount };
      },
    );
  };

  return (
    <div className="flex w-[380px] flex-col bg-popover text-popover-foreground">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h4 className="font-semibold text-sm">Notifications</h4>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleMarkAllRead}
            disabled={isPending || markAllMutation.isPending}
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact
                onRead={handleItemRead}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border/60 bg-muted/30 p-2">
        <Button variant="outline" className="w-full text-xs h-8" asChild onClick={onClose}>
          <Link href="/hr/notifications">
            View all notifications
          </Link>
        </Button>
      </div>
    </div>
  );
}
