'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, User, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface HrNavigationItem {
    href: string;
    label: string;
}

function isActivePath(currentPath: string, itemHref: string): boolean {
    if (currentPath === itemHref) {
        return true;
    }
    if (itemHref !== '/' && currentPath.startsWith(`${itemHref}/`)) {
        return true;
    }
    return false;
}

// Split navigation items into primary and overflow
const PRIMARY_NAV_COUNT = 5;

export function HrNavigationLinks({ items }: { items: HrNavigationItem[] }) {
    const pathname = usePathname();

    const primaryItems = items.slice(0, PRIMARY_NAV_COUNT);
    const overflowItems = items.slice(PRIMARY_NAV_COUNT);

    return (
        <nav aria-label="HR navigation" className="flex items-center gap-1">
            {primaryItems.map((item) => {
                const active = pathname ? isActivePath(pathname, item.href) : false;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'relative rounded-md px-3 py-1.5 text-sm font-medium transition',
                            'focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_0_0_4px_hsl(var(--primary)/0.2)]',
                            active
                                ? 'bg-primary/12 text-foreground shadow-[0_10px_20px_-16px_hsl(var(--primary)/0.45)] after:absolute after:left-2 after:right-2 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-linear-to-r after:from-primary/80 after:via-accent/60 after:to-transparent'
                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:shadow-[0_8px_16px_-14px_hsl(var(--foreground)/0.2)]',
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}

            {overflowItems.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            More
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {overflowItems.map((item) => {
                            const active = pathname ? isActivePath(pathname, item.href) : false;
                            return (
                                <DropdownMenuItem key={item.href} asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(active && 'font-medium text-primary')}
                                    >
                                        {item.label}
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </nav>
    );
}

export function HrUserInfo({
    organizationLabel,
    userEmail,
    roleKey,
}: {
    organizationLabel: string | null;
    userEmail: string | null;
    roleKey: string;
}) {
    // Format role key for display
    const roleLabel = roleKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (string_) => string_.toUpperCase())
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
                    <p className="text-sm font-medium">{userEmail ?? 'Unknown user'}</p>
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
                    <Link href="/hr/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
