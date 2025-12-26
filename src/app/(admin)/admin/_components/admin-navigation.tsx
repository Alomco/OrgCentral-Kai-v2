import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import type { OrgPermissionMap } from '@/server/security/access-control';
import { hasPermission } from '@/lib/security/permission-check';

import { AdminNavigationLinks, AdminUserInfo } from './admin-navigation-links';

type NavAudience = 'admin' | 'dev';

const ADMIN_NAV_ITEMS = [
    { href: '/admin/dashboard', label: 'Dashboard', audience: 'admin' },
    { href: '/org/members', label: 'Members', audience: 'admin' },
    { href: '/org/roles', label: 'Roles', audience: 'admin' },
    { href: '/hr/dashboard', label: 'HR', audience: 'admin' },
    { href: '/dev/dashboard', label: 'Dev Tools', audience: 'dev' },
] as const;

function canAccessItem(permissions: OrgPermissionMap, audience: NavAudience): boolean {
    if (audience === 'dev') {
        return hasPermission(permissions, 'organization', 'governance');
    }
    return hasPermission(permissions, 'organization', 'read');
}

export interface AdminNavigationProps {
    organizationId: string;
    organizationLabel: string | null;
    roleKey: string;
    permissions: OrgPermissionMap;
    userEmail: string | null;
}

export function AdminNavigation(props: AdminNavigationProps) {
    const items = ADMIN_NAV_ITEMS
        .filter((item) => canAccessItem(props.permissions, item.audience))
        .map(({ href, label }) => ({ href, label }));

    return (
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-6">
                    <Link
                        href="/admin/dashboard"
                        suppressHydrationWarning
                        className="flex items-center gap-2 font-semibold text-foreground motion-safe:transition-colors hover:text-primary"
                    >
                        <ShieldCheck className="h-5 w-5" />
                        <span className="hidden sm:inline">Admin</span>
                    </Link>
                    <AdminNavigationLinks items={items} />
                </div>
                <AdminUserInfo
                    organizationLabel={props.organizationLabel}
                    userEmail={props.userEmail}
                    roleKey={props.roleKey}
                />
            </div>
        </header>
    );
}
