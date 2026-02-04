'use client';

import { memo } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { NotificationItem, type NotificationSummary } from '@/components/notifications/notification-item';

interface NotificationRowProps {
  notification: NotificationSummary;
  selected: boolean;
  onToggle: () => void;
  onRead: (id: string) => void;
}

export const NotificationRow = memo(function NotificationRow({
  notification,
  selected,
  onToggle,
  onRead,
}: NotificationRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-1 pl-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label="Select notification"
        />
      </div>
      <div className="flex-1">
        <NotificationItem
          notification={notification}
          onRead={onRead}
        />
      </div>
    </div>
  );
});
