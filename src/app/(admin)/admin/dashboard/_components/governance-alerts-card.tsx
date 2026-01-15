import Link from 'next/link';

import { ThemeBadge, ThemeButton } from '@/components/theme/primitives/interactive';
import {
    ThemeCard,
    ThemeCardContent,
    ThemeCardDescription,
    ThemeCardHeader,
    ThemeCardTitle,
} from '@/components/theme/cards/theme-card';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import { getAdminDashboardGovernanceAlerts } from '@/server/use-cases/admin/dashboard/get-admin-dashboard-governance';

interface GovernanceAlertsCardProps {
    authorization: RepositoryAuthorizationContext;
}

function resolveSeverityVariant(severity: 'low' | 'medium' | 'high') {
    if (severity === 'high') {
        return 'destructive';
    }
    if (severity === 'medium') {
        return 'glow';
    }
    return 'outline';
}

export async function GovernanceAlertsCard({ authorization }: GovernanceAlertsCardProps) {
    const alerts = await getAdminDashboardGovernanceAlerts(authorization);

    return (
        <ThemeCard variant="glass" hover="lift" padding="lg" className="h-full">
            <ThemeCardHeader accent>
                <ThemeCardTitle size="md">Governance alerts</ThemeCardTitle>
                <ThemeCardDescription>
                    Prioritized items requiring attention across compliance and access controls.
                </ThemeCardDescription>
            </ThemeCardHeader>
            <ThemeCardContent>
                {alerts.length === 0 ? (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
                        No active governance alerts. Your controls are aligned.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                                    </div>
                                    <ThemeBadge variant={resolveSeverityVariant(alert.severity)} size="sm">
                                        {alert.severity}
                                    </ThemeBadge>
                                </div>
                                {alert.actionHref && alert.actionLabel ? (
                                    <Link href={alert.actionHref}>
                                        <ThemeButton variant="outline" size="sm">
                                            {alert.actionLabel}
                                        </ThemeButton>
                                    </Link>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </ThemeCardContent>
        </ThemeCard>
    );
}

export function GovernanceAlertsSkeleton() {
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
