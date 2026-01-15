import Link from 'next/link';
import { type ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface AdminSidebarNavLinkProps {
    href: string;
    label: string;
    icon: typeof ShieldCheck;
    description?: string;
    active?: boolean;
    compact?: boolean;
    onClick?: () => void;
}

export function AdminSidebarNavLink({
    href,
    label,
    icon: Icon,
    description,
    active = false,
    compact = false,
    onClick,
}: AdminSidebarNavLinkProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'focus-visible:rounded-lg',
                active &&
                    'bg-gradient-to-r from-primary/10 to-accent/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.2)] before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-accent',
                compact && 'py-1.5',
            )}
            prefetch={false}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-primary/15',
                    active && 'bg-gradient-to-br from-primary/15 to-accent/15',
                )}
            >
                <Icon
                    className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-primary' : 'text-primary/60 group-hover:text-primary',
                    )}
                    aria-hidden="true"
                />
            </span>
            <div className="min-w-0 flex-1">
                <span className={cn('font-medium', active && 'text-primary')}>{label}</span>
                {description && !compact && (
                    <p className="mt-1 truncate text-xs text-muted-foreground/70">{description}</p>
                )}
            </div>
        </Link>
    );
}
