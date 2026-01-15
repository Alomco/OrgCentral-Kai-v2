'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { OrgPermissionMap } from '@/server/security/access-control';

import { getAdminNavItems } from './admin-nav-items';
import { AdminSidebarNavLink } from './modern-admin-sidebar-nav-link';

interface ModernAdminSidebarProps {
    organizationLabel: string | null;
    roleKey: string;
    permissions: OrgPermissionMap;
}

function isActive(path: string | null | undefined, href: string): boolean {
    if (!path) {
        return false;
    }
    return path === href || (href !== '/' && path.startsWith(`${href}/`));
}

function formatRole(roleKey: string): string {
    return roleKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}

export function ModernAdminSidebar({ organizationLabel, roleKey, permissions }: ModernAdminSidebarProps) {
    const pathname = usePathname();
    const items = getAdminNavItems(permissions);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarOpen(true)}
                className={cn(
                    'md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background/80 backdrop-blur-md border border-border/30',
                    'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background',
                    'transition-all duration-200 ease-in-out'
                )}
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
            >
                <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Sidebar backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-14 z-[var(--z-sticky)] h-[calc(100vh-3.5rem)] w-64 border-r border-border/30 bg-background/70 backdrop-blur-sm',
                    'transform transition-all duration-300 ease-in-out',
                    sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full md:translate-x-0 md:opacity-100',
                    'shadow-lg'
                )}
                aria-label="Admin sidebar navigation"
                role="navigation"
            >
                <div className="flex h-full flex-col p-4">
                    {/* Logo and Role Section */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/admin/dashboard"
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-foreground',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                'transition-colors duration-200'
                            )}
                            aria-label="Global Admin Dashboard"
                        >
                            <span
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/25"
                                aria-hidden="true"
                            >
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">Global Admin</span>
                                <span className="text-xs text-muted-foreground">Control Center</span>
                            </div>
                        </Link>

                        {/* Close button for mobile */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-1 rounded-md hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-200"
                            aria-label="Close navigation menu"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Organization Info Card */}
                    <div className="mt-4 rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-accent/5 px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Organization
                            </p>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {formatRole(roleKey)}
                            </span>
                        </div>
                        <p
                            className="mt-2 truncate text-sm font-semibold text-foreground"
                            title={organizationLabel ?? 'Organization'}
                        >
                            {organizationLabel ?? 'Organization'}
                        </p>
                    </div>

                    {/* Navigation Section */}
                    <nav aria-label="Main navigation" className="mt-6 flex-1 overflow-y-auto">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Navigation
                        </p>
                        <div className="rounded-xl border border-border/30 bg-background/60 p-2 shadow-[inset_0_1px_0_hsl(var(--border)/0.35)]">
                            {items.map((item) => (
                                <AdminSidebarNavLink
                                    key={item.href}
                                    href={item.href}
                                    label={item.label}
                                    description={item.description}
                                    icon={item.icon}
                                    active={isActive(pathname, item.href)}
                                    onClick={() => setSidebarOpen(false)}
                                />
                            ))}
                        </div>
                    </nav>

                    {/* Quick Links Section */}
                    <nav aria-label="Quick links" className="mt-6">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Quick Links
                        </p>
                        <div className="rounded-xl border border-border/30 bg-background/60 p-2">
                            <AdminSidebarNavLink
                                href="/admin/dashboard"
                                label="Admin"
                                icon={Settings}
                                active={isActive(pathname, '/admin')}
                                compact
                                onClick={() => setSidebarOpen(false)}
                            />
                            <AdminSidebarNavLink
                                href="/hr/dashboard"
                                label="HR"
                                icon={Users}
                                compact
                                onClick={() => setSidebarOpen(false)}
                            />
                            <AdminSidebarNavLink
                                href="/dashboard"
                                label="Employee"
                                icon={LayoutDashboard}
                                compact
                                onClick={() => setSidebarOpen(false)}
                            />
                        </div>
                    </nav>

                    {/* Exit Admin Section */}
                    <div className="mt-auto pt-4 border-t border-border/30">
                        <Link
                            href="/dashboard"
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                'transition-colors duration-200'
                            )}
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Exit Admin
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}