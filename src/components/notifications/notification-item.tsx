'use client';

import { useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  Info,
  X
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { HRNotificationDTO, HRNotificationTypeCode } from '@/server/types/hr/notifications';
import { markHrNotificationRead } from '@/app/(app)/hr/notifications/actions';
import { toast } from 'sonner';

interface NotificationItemProps {
  notification: NotificationSummary;
  compact?: boolean;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export type NotificationSummary = Pick<
  HRNotificationDTO,
  'id' | 'title' | 'message' | 'type' | 'priority' | 'isRead' | 'createdAt' | 'actionUrl' | 'actionLabel'
>;

const TYPE_ICONS: Record<HRNotificationTypeCode, React.ElementType> = {
  'leave-approval': CheckCircle,
  'leave-rejection': X,
  'document-expiry': AlertTriangle,
  'policy-update': FileText,
  'performance-review': FileText,
  'time-entry': Clock,
  'training-assigned': Calendar,
  'training-due': AlertTriangle,
  'training-completed': CheckCircle,
  'training-overdue': AlertTriangle,
  'system-announcement': Info,
  'compliance-reminder': AlertTriangle,
  'other': Bell,
};

const PRIORITY_STYLES = {
  low: 'border-l-2 border-l-border/60',
  medium: 'border-l-2 border-l-primary/60',
  high: 'border-l-2 border-l-secondary/70',
  urgent: 'border-l-2 border-l-destructive/70',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function NotificationItem({ notification, compact = false, onRead }: NotificationItemProps) {
  const [isPending, startTransition] = useTransition();
  const Icon = Object.prototype.hasOwnProperty.call(TYPE_ICONS, notification.type)
    ? TYPE_ICONS[notification.type]
    : Bell;

  const handleMarkRead = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (notification.isRead || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await markHrNotificationRead({ notificationId: notification.id });
      if (result.success) {
        onRead?.(notification.id);
      } else {
        toast.error('Failed to mark as read');
      }
    });
  };

  return (
    <div
      className={cn(
        "relative flex gap-3 p-3 transition-colors hover:bg-muted/50 group",
        !notification.isRead && "bg-muted/20",
        PRIORITY_STYLES[notification.priority],
        compact ? "text-sm" : "rounded-lg border"
      )}
    >
      <div className={cn("mt-1 shrink-0", !notification.isRead && "text-primary")}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p
              className={cn("font-medium leading-none line-clamp-1", !notification.isRead && "font-semibold")}
              title={notification.title}
            >
              {notification.title}
            </p>
            <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {PRIORITY_LABELS[notification.priority]}
            </span>
          </div>
          {!compact && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>

        <p className={cn("text-muted-foreground line-clamp-2", compact && "text-xs")}>
          {notification.message}
        </p>

        {compact && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 opacity-100 transition-opacity">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleMarkRead}
              disabled={isPending}
              aria-label="Mark notification as read"
            >
              Mark as read
            </Button>
          )}
          {notification.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="h-6 px-2 text-xs"
              asChild
            >
              <a
                href={notification.actionUrl}
                onClick={(event) => event.stopPropagation()}
                aria-label={notification.actionLabel ?? 'Open details'}
              >
                {notification.actionLabel ?? 'Open details'}
              </a>
            </Button>
          )}
        </div>
      </div>

      {!notification.isRead && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
}
