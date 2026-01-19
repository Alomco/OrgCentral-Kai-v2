'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCheck } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';
import { markAllHrNotificationsRead } from '@/app/(app)/hr/notifications/actions';

interface NotificationDropdownProps {
  notifications: HRNotificationDTO[];
  onClose?: () => void;
}

export function NotificationDropdown({ notifications, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllHrNotificationsRead();
      if (result.success) {
        toast.success('All notifications marked as read');
        router.refresh();
      } else {
        toast.error('Failed to mark all as read');
      }
    });
  };

  const handleItemRead = () => {
    router.refresh();
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
            disabled={isPending}
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
