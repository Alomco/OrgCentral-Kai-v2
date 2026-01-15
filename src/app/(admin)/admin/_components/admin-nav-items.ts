import type { LucideIcon } from 'lucide-react';
import {
    Briefcase,
    KeyRound,
    LayoutDashboard,
    Users,
    Wrench,
    Building2,
} from 'lucide-react';

import type { OrgPermissionMap } from '@/server/security/access-control';
import { hasPermission } from '@/lib/security/permission-check';

export type AdminNavAudience = 'admin' | 'dev';

export interface AdminNavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    audience: AdminNavAudience;
    description?: string;
    ariaLabel?: string; // Accessibility label for screen readers
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        audience: 'admin',
        description: 'Platform overview & insights',
        ariaLabel: 'Admin Dashboard',
    },
    {
        href: '/org/profile',
        label: 'Organization',
        icon: Building2,
        audience: 'admin',
        description: 'Profile, branding, compliance',
        ariaLabel: 'Organization Profile',
    },
    {
        href: '/org/members',
        label: 'Members',
        icon: Users,
        audience: 'admin',
        description: 'User access & invitations',
        ariaLabel: 'Organization Members',
    },
    {
        href: '/org/roles',
        label: 'Roles',
        icon: KeyRound,
        audience: 'admin',
        description: 'Permissions & policies',
        ariaLabel: 'Organization Roles',
    },
    {
        href: '/hr/dashboard',
        label: 'HR',
        icon: Briefcase,
        audience: 'admin',
        description: 'People operations',
        ariaLabel: 'HR Dashboard',
    },
    {
        href: '/dev/dashboard',
        label: 'Dev Tools',
        icon: Wrench,
        audience: 'dev',
        description: 'Diagnostics & tooling',
        ariaLabel: 'Developer Tools',
    },
];

function canAccessItem(permissions: OrgPermissionMap, audience: AdminNavAudience): boolean {
    if (audience === 'dev') {
        return hasPermission(permissions, 'organization', 'governance');
    }
    return hasPermission(permissions, 'organization', 'read');
}

export function getAdminNavItems(permissions: OrgPermissionMap): AdminNavItem[] {
    return ADMIN_NAV_ITEMS.filter((item) => canAccessItem(permissions, item.audience));
}