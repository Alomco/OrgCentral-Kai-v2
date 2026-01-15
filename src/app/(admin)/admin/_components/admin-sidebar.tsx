'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ArrowLeft, LayoutDashboard, Users, Settings } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { OrgPermissionMap } from '@/server/security/access-control';

import { getAdminNavItems } from './admin-nav-items';

interface AdminSidebarProps {
    organizationLabel: string | null;
    roleKey: string;
    permissions: OrgPermissionMap;
}

function isActive(path: string, href: string): boolean {
    return path === href || (href !== '/' && path.startsWith(`${href}/`));
}

const FOCUS_RING_CLASS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function formatRole(roleKey: string): string {
    return roleKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}

export function AdminSidebar({ organizationLabel, roleKey, permissions }: AdminSidebarProps) {
    const pathname = usePathname();
    const items = getAdminNavItems(permissions);
    const organizationLabelFallback = 'Organization';

    return (
        <aside
            className={cn(
                'fixed left-0 top-14 z-(--z-sticky) h-[calc(100vh-3.5rem)] w-56 border-r border-border/30 bg-background/70 backdrop-blur-sm'
            )}
            aria-label="Admin sidebar"
        >
            <div className="flex h-full flex-col p-4">
                <Link
                    href="/admin/dashboard"
                    className={cn(
                        'flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-foreground',
                        FOCUS_RING_CLASS,
                    )}
                >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent text-white shadow-md shadow-primary/25">
                        <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm">Global Admin</span>
                        <span className="text-[11px] text-muted-foreground">Control Center</span>
                    </div>
                </Link>
                <div className="mt-4 rounded-xl border border-border/40 bg-background/60 px-3 py-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{organizationLabelFallback}</p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {formatRole(roleKey)}
                        </span>
                    </div>
                    <p
                        className="mt-2 truncate text-sm font-semibold text-foreground"
                        title={organizationLabel ?? organizationLabelFallback}
                    >
                        {organizationLabel ?? organizationLabelFallback}
                    </p>
                </div>

                <nav aria-label="Admin navigation" className="mt-6 flex-1">
                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Navigation
                    </p>
                    <div className="rounded-xl border border-border/30 bg-background/60 p-2 shadow-[inset_0_1px_0_hsl(var(--border)/0.35)]">
                        {items.map((item) => (
                            <NavLink
                                key={item.href}
                                href={item.href}
                                label={item.label}
                                description={item.description}
                                icon={item.icon}
                                active={isActive(pathname, item.href)}
                            />
                        ))}
                    </div>
                </nav>

                <nav aria-label="Admin quick links" className="mt-6">
                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Quick Links
                    </p>
                    <div className="rounded-xl border border-border/30 bg-background/60 p-2">
                        <NavLink href="/admin/dashboard" label="Admin" icon={Settings} active={isActive(pathname, '/admin')} compact />
                        <NavLink href="/hr/dashboard" label="HR" icon={Users} compact />
                        <NavLink href="/dashboard" label="Employee" icon={LayoutDashboard} compact />
                    </div>
                </nav>

                <div className="mt-6">
                    <Link
                        href="/dashboard"
                        className={cn(
                            'flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground',
                            FOCUS_RING_CLASS,
                        )}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Exit Admin
                    </Link>
                </div>
            </div>
        </aside>
    );
}

function NavLink({
    href,
    label,
    icon: Icon,
    description,
    active = false,
    compact = false,
}: {
    href: string;
    label: string;
    icon: typeof ShieldCheck;
    description?: string;
    active?: boolean;
    compact?: boolean;
}) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                FOCUS_RING_CLASS,
                active && 'bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.2)] before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-primary/60',
                compact && 'py-1.5'
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-primary/15',
                    active && 'bg-primary/15'
                )}
            >
                <Icon
                    className="h-4 w-4 shrink-0 text-primary/60 transition-colors group-hover:text-primary"
                    aria-hidden="true"
                />
            </span>
            <div className="min-w-0 flex-1">
                <span className="font-medium">{label}</span>
                {description && !compact && (
                    <p className="truncate text-xs text-muted-foreground/70">{description}</p>
                )}
            </div>
        </Link>
    );
}