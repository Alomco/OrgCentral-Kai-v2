import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import {
    ShieldCheck,
    Users,
    UserPlus,
    Settings,
    KeyRound,
    LayoutDashboard,
    Briefcase,
    Wrench,
    Zap,
} from 'lucide-react';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getUserService } from '@/server/services/org/users/user-service.provider';
import { getRoleService } from '@/server/services/org';
import { ThemeCard } from '@/components/theme/cards/theme-card';
import { ThemeGrid } from '@/components/theme/layout/primitives';
import { ThemeButton, ThemeBadge } from '@/components/theme/primitives/interactive';
import { Container, GradientAccent } from '@/components/theme/primitives/surfaces';
import { GradientOrb } from '@/components/theme/decorative/effects';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

export const metadata: Metadata = {
    title: 'Global Admin Dashboard - OrgCentral',
    description: 'Platform-wide controls for tenant governance and security.',
};

// Quick action links for admins
const QUICK_ACTIONS = [
    {
        title: 'Manage Members',
        description: 'Invite users and manage access',
        href: '/org/members',
        icon: Users,
    },
    {
        title: 'Manage Roles',
        description: 'Create and configure roles',
        href: '/org/roles',
        icon: KeyRound,
    },
    {
        title: 'Organization Settings',
        description: 'Configure org preferences',
        href: '/org/settings',
        icon: Settings,
    },
    {
        title: 'HR Dashboard',
        description: 'Employee and leave management',
        href: '/hr/dashboard',
        icon: Briefcase,
    },
    {
        title: 'Dev Tools',
        description: 'Development utilities',
        href: '/dev/dashboard',
        icon: Wrench,
    },
] as const;

async function OrgStatsCard() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:admin:stats',
    });

    const userService = getUserService();
    const [activeUsers, pendingInvites, roles] = await Promise.all([
        userService.countUsersInOrganization({ authorization, filters: { status: 'ACTIVE' } }),
        userService.countUsersInOrganization({ authorization, filters: { status: 'INVITED' } }),
        getRoleService().listRoles({ authorization }),
    ]);

    return (
        <ThemeGrid cols={3} gap="lg">
            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-foreground">{activeUsers}</h3>
                            <span className="text-sm font-medium text-green-500">↑ +12%</span>
                        </div>
                    </div>
                    <GradientAccent variant="primary" rounded="lg" className="p-3">
                        <Users className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>

            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-foreground">{pendingInvites}</h3>
                        </div>
                    </div>
                    <GradientAccent variant="sunset" rounded="lg" className="p-3">
                        <UserPlus className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>

            <ThemeCard variant="glass" hover="lift" padding="md">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-foreground">{roles.length}</h3>
                        </div>
                    </div>
                    <GradientAccent variant="accent" rounded="lg" className="p-3">
                        <KeyRound className="h-5 w-5 text-white" />
                    </GradientAccent>
                </div>
            </ThemeCard>
        </ThemeGrid>
    );
}

function OrgStatsSkeleton() {
    return (
        <ThemeGrid cols={3} gap="lg">
            {[1, 2, 3].map((index) => (
                <div key={index} className="h-32 animate-pulse bg-muted/20 rounded-xl" />
            ))}
        </ThemeGrid>
    );
}

export default function AdminDashboardPage() {
    return (
        <Container spacing="lg" maxWidth="screen" className="relative overflow-hidden">
            {/* Decorative Background Effects */}
            <GradientOrb position="top-right" color="primary" className="opacity-30" />
            <GradientOrb position="bottom-left" color="accent" className="opacity-20" />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Global Admin</p>
                        <h1 className="text-4xl font-bold bg-linear-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                            Platform Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Manage users, roles, and organization settings.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <ThemeBadge variant="glow" size="lg">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Super Admin
                        </ThemeBadge>
                    </div>
                </div>
            </div>

            {/* Organization Stats */}
            <Suspense fallback={<OrgStatsSkeleton />}>
                <OrgStatsCard />
            </Suspense>

            {/* Quick Actions */}
            <div className="mt-8 relative z-10">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Actions
                </h2>
                <ThemeGrid cols={3} gap="md">
                    {QUICK_ACTIONS.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <ThemeCard variant="glass" hover="lift" padding="lg" className="h-full cursor-pointer group">
                                <div className="flex items-start gap-4">
                                    <GradientAccent variant="vibrant" rounded="lg" className="p-3 group-hover:scale-110 transition-transform">
                                        <action.icon className="h-5 w-5 text-white" />
                                    </GradientAccent>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {action.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </ThemeCard>
                        </Link>
                    ))}
                </ThemeGrid>
            </div>

            {/* Invite Member CTA */}
            <div className="mt-8 relative z-10">
                <ThemeCard variant="gradient" padding="lg">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <GradientAccent variant="accent" rounded="full" className="p-3">
                                <UserPlus className="h-6 w-6 text-white" />
                            </GradientAccent>
                            <div>
                                <h3 className="font-semibold text-foreground">Invite Team Members</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Add new users to your organization with role-based access.
                                </p>
                            </div>
                        </div>
                        <Link href="/org/members">
                            <ThemeButton variant="neon" size="lg" animation="shimmer">
                                <UserPlus className="h-4 w-4" />
                                Invite Members
                            </ThemeButton>
                        </Link>
                    </div>
                </ThemeCard>
            </div>

            {/* Navigation to other dashboards */}
            <div className="mt-8 relative z-10">
                <ThemeCard variant="glass" padding="lg">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Switch Dashboard</p>
                            <p className="text-xs text-muted-foreground mt-1">Navigate to other workspace views.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/dashboard">
                                <ThemeButton variant="outline" size="md">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Employee
                                </ThemeButton>
                            </Link>
                            <Link href="/hr/dashboard">
                                <ThemeButton variant="outline" size="md">
                                    <Briefcase className="h-4 w-4" />
                                    HR
                                </ThemeButton>
                            </Link>
                            <Link href="/dev/dashboard">
                                <ThemeButton variant="outline" size="md">
                                    <Wrench className="h-4 w-4" />
                                    Dev
                                </ThemeButton>
                            </Link>
                        </div>
                    </div>
                </ThemeCard>
            </div>
        </Container>
    );
}
