'use client';

import { Activity, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Building2, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface AdminNavItem {
    href: string;
    label: string;
}

function isActive(path: string, href: string): boolean {
    return path === href || (href !== '/' && path.startsWith(`${href}/`));
}

const PRIMARY_COUNT = 4;

function subscribeHydration(onStoreChange: () => void): () => void {
    const id = window.requestAnimationFrame(onStoreChange);
    return () => window.cancelAnimationFrame(id);
}

function getClientHydrationSnapshot(): boolean {
    return true;
}

function getServerHydrationSnapshot(): boolean {
    return false;
}

export function AdminNavigationLinks({ items }: { items: AdminNavItem[] }) {
    const pathname = usePathname();
    const mounted = useSyncExternalStore(subscribeHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);
    const primary = items.slice(0, PRIMARY_COUNT);
    const overflow = items.slice(PRIMARY_COUNT);

    const stablePathname = mounted ? pathname : null;

    return (
        <nav aria-label="Admin navigation" className="flex items-center gap-1">
            {primary.map((item) => {
                const active = stablePathname ? isActive(stablePathname, item.href) : false;
                return (
                    <Activity key={item.href} mode={active ? 'visible' : 'hidden'}>
                        <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-sm font-medium motion-safe:transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                active
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            {item.label}
                        </Link>
                    </Activity>
                );
            })}
            {overflow.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            More <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {overflow.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                                <Link href={item.href}>{item.label}</Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </nav>
    );
}

export function AdminUserInfo({
    organizationLabel,
    userEmail,
    roleKey,
}: {
    organizationLabel: string | null;
    userEmail: string | null;
    roleKey: string;
}) {
    const roleLabel = roleKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[150px] truncate">
                        {userEmail?.split('@')[0] ?? 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2">
                    <p className="text-sm font-medium">{userEmail ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <DropdownMenuSeparator />
                <div className="px-3 py-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                        {organizationLabel ?? 'Organization'}
                    </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard">Employee Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/hr/dashboard">HR Dashboard</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
