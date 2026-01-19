'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building,
    ShieldCheck,
    ChevronsUpDown,
} from 'lucide-react';

import type { AuthSession } from '@/server/lib/auth';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Accordion } from '@/components/ui/accordion';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { hasPermission } from '@/lib/security/permission-check';

import { navItems } from './app-sidebar-nav';
import { AppSidebarNavItem } from './app-sidebar-nav-item';
import styles from './app-sidebar.module.css';

interface AppSidebarProps {
    session: NonNullable<AuthSession>;
    authorization: RepositoryAuthorizationContext;
    organizationLabel: string | null;
}

export function AppSidebar({ authorization, organizationLabel }: AppSidebarProps) {
    const pathname = usePathname();
    const { open } = useSidebar();

    const isAdmin = hasPermission(authorization.permissions, 'organization', 'update');

    return (
        <Sidebar
            collapsible="icon"
            className={styles.sidebar}
            data-ui-surface="container"
        >
            <nav aria-label="Primary" className="flex h-full flex-col">
                <SidebarHeader className={styles.sidebarHeader} data-ui-surface="container">
                    <div className={styles.headerInner} data-collapsed={!open}>
                        <SidebarTrigger className={styles.sidebarTrigger} />
                        <Link
                            href="/dashboard"
                            className={styles.logoLink}
                            data-collapsed={!open}
                        >
                            <span className={styles.logoText}>
                                {organizationLabel ?? 'OrgCentral'}
                            </span>
                        </Link>
                    </div>
                </SidebarHeader>

                <SidebarContent className={styles.sidebarContent}>
                    <Accordion type="multiple" className="w-full">
                        <SidebarMenu className="space-y-1">
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <AppSidebarNavItem item={item} pathname={pathname} open={open} />
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </Accordion>
                </SidebarContent>

                <SidebarFooter className={styles.sidebarFooter} data-ui-surface="container">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className={styles.tenantButton}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={styles.tenantIcon}>
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div className={styles.tenantInfo} data-collapsed={!open}>
                                                <span className={styles.tenantName}>
                                                    {organizationLabel ?? 'Organization'}
                                                </span>
                                                <span className={styles.tenantRole}>
                                                    {authorization.roleKey}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden text-sidebar-foreground/60" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                                    align="start"
                                    side={open ? 'bottom' : 'right'}
                                    sideOffset={4}
                                >
                                    <DropdownMenuItem className="gap-2" asChild>
                                        <Link href="/org/profile">
                                            <Building className="h-4 w-4" />
                                            <span className="flex-1">Organization</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    {isAdmin ? (
                                        <DropdownMenuItem className="gap-2" asChild>
                                            <Link href="/admin">
                                                <ShieldCheck className="h-4 w-4" />
                                                <span>Admin Portal</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ) : null}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </nav>
        </Sidebar>
    );
}
