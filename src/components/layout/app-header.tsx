'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';

import type { AuthSession } from '@/server/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { NotificationBell } from '@/components/notifications/notification-bell';
import type { HRNotificationDTO } from '@/server/types/hr/notifications';
import { UserNav } from './user-nav';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrgBranding } from '@/server/types/branding-types';
import styles from './app-header.module.css';

interface AppHeaderProps {
    session: NonNullable<AuthSession>;
    authorization: RepositoryAuthorizationContext;
    branding?: OrgBranding | null;
    notifications: HRNotificationDTO[];
    unreadCount: number;
}

export function AppHeader({ 
    session, 
    authorization, 
    branding, 
    notifications, 
    unreadCount 
}: AppHeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const searchTerm = formData.get('search');
        if (searchTerm) {
            // TODO: Implement search functionality
            setIsSearchOpen(false);
        }
    };

    return (
        <header className={styles.header}>
            <SidebarTrigger className="lg:hidden" />

            <div className={styles.headerContent}>
                <Link href="/dashboard" className={styles.logo}>
                    <span className={styles.logoText}>
                        {branding?.companyName ?? 'OrgCentral'}
                    </span>
                </Link>
            </div>

            <div className={styles.spacer} />

            <div className={styles.actions}>
                {/* Search */}
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8.5 w-8.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            aria-label="Search"
                        >
                            <Search className="h-4.5 w-4.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
                        <form onSubmit={handleSearchSubmit} className="space-y-3">
                            <p className="text-sm font-medium">
                                Search OrgCentral
                            </p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    name="search"
                                    type="search"
                                    placeholder="Search..."
                                    className="pl-10"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Try searching for employees, policies, or documents
                            </p>
                        </form>
                    </PopoverContent>
                </Popover>

                {/* Notifications */}
                <NotificationBell 
                    notifications={notifications} 
                    unreadCount={unreadCount} 
                />

                {/* Theme & Style Switcher */}
                <ThemeSwitcher />

                {/* User Navigation */}
                <UserNav session={session} authorization={authorization} />
            </div>
        </header>
    );
}

