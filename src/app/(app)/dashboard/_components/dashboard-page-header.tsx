import { Badge } from '@/components/ui/badge';
import motionStyles from '@/styles/motion/view-transitions.module.css';

export function DashboardPageHeader(props: {
    organizationId: string;
    roleKey: string;
    userEmail: string | null;
}) {
    // Shorten org ID for display (show first 8 chars)
    const shortOrgId = props.organizationId.slice(0, 8);

    return (
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-3">
                <h1 className={`text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight ${motionStyles.sharedTitle}`}>
                    Dashboard
                </h1>
                <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                    Monitor your organization, manage tasks, and access quick actions.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end min-w-0">
                <Badge variant="secondary" className="font-mono text-xs border border-border/60 bg-muted/50 text-foreground hover:bg-muted/70 transition-colors">
                    {shortOrgId}
                </Badge>
                <Badge variant="outline" className="max-w-[12rem] truncate capitalize border-border/60 bg-muted/40 text-foreground hover:bg-muted/60 transition-colors">
                    {props.roleKey}
                </Badge>
            </div>
        </header>
    );
}

