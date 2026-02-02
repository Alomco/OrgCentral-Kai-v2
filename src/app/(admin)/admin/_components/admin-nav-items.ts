import type { LucideIcon } from 'lucide-react';
import {
    Briefcase,
    CreditCard,
    Globe2,
    KeyRound,
    LayoutDashboard,
    LifeBuoy,
    ShieldUser,
    Users,
    Wrench,
    Building2,
    FileText,
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
        href: '/admin/enterprise',
        label: 'Enterprise',
        icon: Globe2,
        audience: 'admin',
        description: 'Multi-tenant onboarding & metrics',
        ariaLabel: 'Enterprise Dashboard',
    },
    {
        href: '/admin/global/tenant-management',
        label: 'Tenants',
        icon: Building2,
        audience: 'admin',
        description: 'Approve, suspend, and audit tenants',
        ariaLabel: 'Global Tenant Management',
    },
    {
        href: '/admin/global/billing/plans',
        label: 'Billing Plans',
        icon: CreditCard,
        audience: 'admin',
        description: 'Catalog & tenant assignments',
        ariaLabel: 'Global Billing Plans',
    },
    {
        href: '/admin/global/platform-tools',
        label: 'Platform Tools',
        icon: Wrench,
        audience: 'admin',
        description: 'Guarded maintenance operations',
        ariaLabel: 'Platform Tools',
    },
    {
        href: '/admin/global/support-tickets',
        label: 'Support Tickets',
        icon: LifeBuoy,
        audience: 'admin',
        description: 'Triage and resolve escalations',
        ariaLabel: 'Support Tickets Console',
    },
    {
        href: '/admin/global/document-vault',
        label: 'Document Vault',
        icon: FileText,
        audience: 'admin',
        description: 'Tenant-scoped document access',
        ariaLabel: 'Document Vault',
    },
    {
        href: '/admin/global/user-impersonation',
        label: 'Impersonation',
        icon: ShieldUser,
        audience: 'admin',
        description: 'Time-boxed support access',
        ariaLabel: 'User Impersonation',
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
