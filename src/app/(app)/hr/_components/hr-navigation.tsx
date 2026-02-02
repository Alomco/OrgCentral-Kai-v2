import Link from 'next/link';
import { Briefcase } from 'lucide-react';

import type { OrgPermissionMap } from '@/server/security/access-control';
import { hasPermission } from '@/lib/security/permission-check';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

import { HrNavigationLinks, HrUserInfo } from './hr-navigation-links';

const HR_NAVIGATION_ITEMS = [
    { href: '/hr/dashboard', label: 'Dashboard', audience: 'member' },
    { href: '/hr/profile', label: 'My Profile', audience: 'member' },
    { href: '/hr/leave', label: 'Leave', audience: 'member' },
    { href: '/hr/absence', label: 'Absence', audience: 'member' },
    { href: '/hr/time-tracking', label: 'Time', audience: 'member' },
    { href: '/hr/training', label: 'Training', audience: 'member' },
    { href: '/hr/performance', label: 'Performance', audience: 'member' },
    { href: '/hr/policies', label: 'Policies', audience: 'member' },
    { href: '/hr/reports', label: 'Reports', audience: 'admin' },
    { href: '/hr/compliance', label: 'Compliance', audience: 'compliance' },
    { href: '/hr/documents', label: 'Documents', audience: 'compliance' },
    { href: '/hr/employees', label: 'Employees', audience: 'admin' },
    { href: '/hr/onboarding', label: 'Onboarding', audience: 'onboarding' },
    { href: '/hr/offboarding', label: 'Offboarding', audience: 'admin' },
    { href: '/hr/settings', label: 'Settings', audience: 'admin' },
] as const;

type HrNavigationAudience = (typeof HR_NAVIGATION_ITEMS)[number]['audience'];

function canAccessNavItem(permissions: OrgPermissionMap, audience: HrNavigationAudience): boolean {
    if (audience === 'member') {
        return hasPermission(permissions, 'employeeProfile', 'read') || hasPermission(permissions, 'organization', 'update');
    }
    if (audience === 'compliance') {
        return hasPermission(permissions, 'audit', 'read') || hasPermission(permissions, 'residency', 'enforce');
    }
    if (audience === 'onboarding') {
        return hasPermission(permissions, 'member', 'invite') || hasPermission(permissions, 'organization', 'update');
    }
    return hasPermission(permissions, 'organization', 'update');
}

export function HrNavigation(props: {
    organizationId: string;
    organizationLabel: string | null;
    userEmail: string | null;
    roleKey: string;
    permissions: OrgPermissionMap;
}) {
    const items = HR_NAVIGATION_ITEMS
        .filter((item) => canAccessNavItem(props.permissions, item.audience))
        .map((item) => ({ href: item.href, label: item.label }));

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
                {/* Left: Logo and Nav */}
                <div className="flex items-center gap-6">
                    <Link
                        href="/hr/dashboard"
                        className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
                    >
                        <Briefcase className="h-5 w-5" />
                        <span className="hidden sm:inline">HR</span>
                    </Link>
                    <HrNavigationLinks items={items} />
                </div>

                {/* Right: Theme + User Info */}
                <div className="flex items-center gap-2">
                    <ThemeSwitcher />
                    <HrUserInfo
                        organizationLabel={props.organizationLabel}
                        userEmail={props.userEmail}
                        roleKey={props.roleKey}
                    />
                </div>
            </div>
        </header>
    );
}
