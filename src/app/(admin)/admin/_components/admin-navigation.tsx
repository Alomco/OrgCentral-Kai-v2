import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface AdminNavigationProps {
    organizationId: string;
    organizationLabel: string | null;
    roleKey: string;
    userEmail: string | null;
}

export function AdminNavigation(props: AdminNavigationProps) {
    const userLabel = props.userEmail ?? 'User';
    const initial = userLabel.trim().charAt(0).toUpperCase() || 'U';

    return (
        <header className="sticky top-0 z-(--z-sticky) h-14 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex h-full items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/dashboard"
                        suppressHydrationWarning
                        className={cn(
                            'flex items-center gap-2 text-lg font-semibold',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        )}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent text-white shadow-md shadow-primary/20">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <span className="bg-linear-to-r from-foreground to-primary bg-clip-text text-transparent">
                            Global Admin
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {props.organizationLabel && (
                        <span className="text-xs text-muted-foreground/60">{props.organizationLabel}</span>
                    )}
                    {props.userEmail && (
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-accent/20 text-xs font-medium text-primary">
                                {initial}
                            </div>
                            <span className="hidden text-sm text-muted-foreground md:block">{props.userEmail}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
