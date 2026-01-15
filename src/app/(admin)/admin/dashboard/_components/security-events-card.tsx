import { ThemeBadge } from '@/components/theme/primitives/interactive';
import {
    ThemeCard,
    ThemeCardContent,
    ThemeCardDescription,
    ThemeCardHeader,
    ThemeCardTitle,
} from '@/components/theme/cards/theme-card';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { getAdminDashboardSecurityEvents } from '@/server/use-cases/admin/dashboard/get-admin-dashboard-security-events';
import type { SecurityEventSeverity } from '@/server/types/admin-dashboard';

interface SecurityEventsCardProps {
    authorization: RepositoryAuthorizationContext;
}

function resolveSeverityVariant(severity: SecurityEventSeverity) {
    if (severity === 'critical' || severity === 'high') {
        return 'destructive';
    }
    if (severity === 'medium') {
        return 'warning';
    }
    if (severity === 'low') {
        return 'info';
    }
    return 'outline';
}

function formatRelativeDate(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) {
        return `${String(minutes)}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${String(hours)}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${String(days)}d ago`;
}

export async function SecurityEventsCard({ authorization }: SecurityEventsCardProps) {
    const events = await getAdminDashboardSecurityEvents(authorization);

    return (
        <ThemeCard variant="glass" hover="lift" padding="lg" className="h-full">
            <ThemeCardHeader accent>
                <ThemeCardTitle size="md">Recent security events</ThemeCardTitle>
                <ThemeCardDescription>
                    Live security signals and audit entries from the last seven days.
                </ThemeCardDescription>
            </ThemeCardHeader>
            <ThemeCardContent>
                {events.length === 0 ? (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                        No recent security events. Monitoring is stable.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-start justify-between gap-4 rounded-lg border border-border/50 bg-card/40 p-4"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">{event.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeDate(event.occurredAt)}
                                    </p>
                                </div>
                                <ThemeBadge variant={resolveSeverityVariant(event.severity)} size="sm">
                                    {event.severity}
                                </ThemeBadge>
                            </div>
                        ))}
                    </div>
                )}
            </ThemeCardContent>
        </ThemeCard>
    );
}

export function SecurityEventsSkeleton() {
    return (
        <ThemeCard variant="glass" padding="lg" className="h-full">
            <div className="h-5 w-40 rounded bg-muted/40 animate-pulse" />
            <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={String(index)} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
                ))}
            </div>
        </ThemeCard>
    );
}
