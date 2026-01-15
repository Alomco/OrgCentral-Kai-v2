'use client';

import Link from 'next/link';
import { ShieldCheck, Bell, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface AdminNavigationProps {
    organizationId: string;
    organizationLabel: string | null;
    roleKey: string;
    userEmail: string | null;
}

export function ModernAdminNavigation(props: AdminNavigationProps) {
    const userLabel = props.userEmail ?? 'User';
    const initial = userLabel.trim().charAt(0).toUpperCase() || 'U';
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        setIsSearchExpanded(false);
    };

    return (
        <header
            className="sticky top-0 z-[var(--z-sticky)] h-16 border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm"
            role="banner"
        >
            <div className="flex h-full items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={cn(
                            'md:hidden p-2 rounded-lg',
                            'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background'
                        )}
                        aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <Link
                        href="/admin/dashboard"
                        suppressHydrationWarning
                        className={cn(
                            'flex items-center gap-2 text-lg font-semibold',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            'transition-colors duration-200'
                        )}
                        aria-label="Global Admin Dashboard"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/20">
                            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <span className="hidden sm:block bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent font-bold">
                            Global Admin
                        </span>
                    </Link>
                </div>

                {/* Search Bar - Full width on mobile, limited on desktop */}
                <div className="flex-1 max-w-2xl mx-4">
                    {isSearchExpanded ? (
                        <form onSubmit={handleSearch} className="w-full">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search admin tools..."
                                    className="w-full pl-10 pr-8 py-2 rounded-lg bg-background/50 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    autoFocus
                                    aria-label="Search admin tools"
                                    onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    aria-label="Submit search"
                                >
                                    <Search className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </div>
                        </form>
                    ) : (
                        <div className="hidden md:flex w-full">
                            <form onSubmit={handleSearch} className="w-full">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search admin tools..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-background/50 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        aria-label="Search admin tools"
                                    />
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Organization Label - Hidden on mobile */}
                    {props.organizationLabel && (
                        <span className="hidden md:inline text-sm font-medium text-muted-foreground/80 bg-secondary/50 px-3 py-1 rounded-full max-w-[120px] truncate" title={props.organizationLabel}>
                            {props.organizationLabel}
                        </span>
                    )}

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Search Button for Mobile */}
                        <button
                            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                            className={cn(
                                'p-2 rounded-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40',
                                isSearchExpanded ? 'bg-muted/50' : ''
                            )}
                            aria-label={isSearchExpanded ? "Close search" : "Open search"}
                        >
                            <Search className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative p-2 rounded-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            aria-label="View notifications"
                        >
                            <Bell className="h-5 w-5" aria-hidden="true" />
                            <span
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"
                                aria-hidden="true"
                            ></span>
                            <span className="sr-only">Notifications</span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div className="hidden md:flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-medium text-primary">
                                    {initial}
                                </div>
                                <span className="text-sm text-muted-foreground max-w-[120px] truncate" title={props.userEmail ?? ''}>
                                    {props.userEmail}
                                </span>
                            </div>

                            {/* User Avatar for Mobile */}
                            <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-medium text-primary">
                                {initial}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu - appears below the header when open */}
            {isMobileMenuOpen && (
                <div className="md:hidden px-4 pb-4">
                    <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
                        <Link
                            href="/admin/dashboard"
                            className="w-full px-4 py-3 rounded-lg bg-muted/50 text-sm font-medium hover:bg-muted/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/org/profile"
                            className="w-full px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Organization
                        </Link>
                        <Link
                            href="/org/members"
                            className="w-full px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Members
                        </Link>
                        <Link
                            href="/org/roles"
                            className="w-full px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Roles
                        </Link>
                        <Link
                            href="/hr/dashboard"
                            className="w-full px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            HR
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}