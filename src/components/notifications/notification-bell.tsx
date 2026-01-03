'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationDropdown } from './notification-dropdown';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';

interface NotificationBellProps {
  unreadCount: number;
  notifications: HRNotificationDTO[];
}

export function NotificationBell({ unreadCount, notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8.5 w-8.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full min-w-[16px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="end" sideOffset={8}>
        <NotificationDropdown 
          notifications={notifications} 
          onClose={() => setIsOpen(false)} 
        />
      </PopoverContent>
    </Popover>
  );
}
