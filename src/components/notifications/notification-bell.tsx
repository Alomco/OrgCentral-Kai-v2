'use client';

import { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationDropdown } from './notification-dropdown';
import type { NotificationSummary } from '@/components/notifications/notification-item';
import {
  buildHrNotificationsQueryKey,
  fetchHrNotifications,
  HR_NOTIFICATION_DROPDOWN_FILTERS,
} from '@/app/(app)/hr/notifications/notification-query';

interface NotificationBellProps {
  unreadCount: number;
  notifications: NotificationSummary[];
}

export function NotificationBell({ unreadCount, notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryKey = useMemo(
    () => buildHrNotificationsQueryKey(HR_NOTIFICATION_DROPDOWN_FILTERS),
    [],
  );
  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchHrNotifications(HR_NOTIFICATION_DROPDOWN_FILTERS),
    initialData: { notifications, unreadCount },
  });
  const currentUnreadCount = data.unreadCount;
  const currentNotifications = data.notifications;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8.5 w-8.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Open notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {currentUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full min-w-[16px]"
            >
              {currentUnreadCount > 9 ? '9+' : currentUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="end" sideOffset={8}>
        <NotificationDropdown
          notifications={currentNotifications}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
