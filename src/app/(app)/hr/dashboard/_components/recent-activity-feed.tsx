import { Bell, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getHrNotifications } from '@/server/use-cases/hr/notifications/get-hr-notifications';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { formatHumanDate } from '../../_components/format-date';

import type { HRNotificationDTO } from '@/server/types/hr/notifications';

interface RecentActivityFeedProps {
    authorization: RepositoryAuthorizationContext;
}

export async function RecentActivityFeed({ authorization }: RecentActivityFeedProps) {
    // 1. Fetch notifications
    const { notifications } = await getHrNotifications({
        service: (await import('@/server/services/hr/notifications/hr-notification-service.provider')).getHrNotificationService(),
    }, {
        authorization,
        userId: authorization.userId,
    });

    const recentNotifications = notifications.slice(0, 10); // Take top 10

    return (
        <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    {recentNotifications.length > 0 ? (
                        <div className="space-y-6">
                            {recentNotifications.map((notification, index) => (
                                <ActivityItem key={notification.id} notification={notification} isLast={index === recentNotifications.length - 1} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Bell className="h-10 w-10 mb-2 opacity-20" />
                            <p>No recent activity</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function ActivityItem({ notification, isLast }: { notification: HRNotificationDTO; isLast: boolean }) {
    // Determine icon based on type (assuming 'type' exists or inference from title/message)
    // For now, default to Info. If notification has type, use it.
    let Icon = Info;
    let iconColor = "text-primary";
    let iconBg = "bg-primary/10";

    if (
        notification.priority === 'high' ||
        notification.priority === 'urgent' ||
        notification.type === 'leave-rejection' ||
        notification.type === 'document-expiry' ||
        notification.type === 'training-overdue' ||
        notification.type === 'compliance-reminder'
    ) {
        Icon = AlertTriangle;
        iconColor = "text-secondary-foreground";
        iconBg = "bg-secondary/70";
    } else if (
        notification.type === 'leave-approval' ||
        notification.type === 'training-completed' ||
        notification.readAt
    ) {
        Icon = CheckCircle;
        iconColor = "text-foreground";
        iconBg = "bg-accent/20";
    }

    return (
        <div className="relative flex gap-4">
            {!isLast && (
                <div className="absolute left-[19px] top-10 h-full w-px bg-border/50" />
            )}
            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/50 ${iconBg} ${iconColor}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1 pt-1">
                <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground">{notification.title}</p>
                    <time className="text-xs text-muted-foreground">
                        {formatHumanDate(new Date(notification.createdAt))}
                    </time>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                </p>
                {notification.actionUrl && (
                    <div className="pt-2">
                        {/* Potential action link if actionUrl is available */}
                    </div>
                )}
            </div>
        </div>
    );
}

export function RecentActivitySkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded-md" />
                    <div className="h-4 w-48 bg-muted rounded-md" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 w-3/4 bg-muted rounded-md" />
                                <div className="h-3 w-1/2 bg-muted rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
