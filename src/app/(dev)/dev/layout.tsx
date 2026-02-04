import { Suspense, type ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { TenantThemeRegistry } from '@/components/theme/tenant-theme-registry';
import { SkipLink } from '@/components/ui/skip-link';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getOrgBranding } from '@/server/branding/get-org-branding';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    ROLE_DASHBOARD_PATHS,
} from '@/server/ui/auth/role-redirect';

import { DevelopmentNavigationShell } from './_components/development-navigation';
import { DevelopmentViewSwitcher } from './_components/development-view-switcher';
import { FloatingParticles } from '@/components/theme/decorative/particles';
import { GradientOrb } from '@/components/theme/decorative/effects';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

export default function DevelopmentLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <DevelopmentLayoutShell>{children}</DevelopmentLayoutShell>
        </Suspense>
    );
}

async function DevelopmentLayoutShell({ children }: { children: ReactNode }) {
    const headerStore = await headers();
    const { session, authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:dev-layout',
        },
    );

    const membershipSnapshot = await getMembershipRoleSnapshot(
        authorization.orgId,
        authorization.userId,
    );
    const dashboardRole = membershipSnapshot ? resolveRoleDashboard(membershipSnapshot) : 'employee';

    // Dev section requires globalAdmin (GLOBAL scope role)
    if (dashboardRole !== 'globalAdmin') {
        redirect(ROLE_DASHBOARD_PATHS[dashboardRole]);
    }

    const branding = await getOrgBranding({
        orgId: authorization.orgId,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    }).catch(() => null);

    const userEmail = typeof session.user.email === 'string' && session.user.email.trim().length > 0
        ? session.user.email
        : null;

    return (
        <TenantThemeRegistry
            orgId={authorization.orgId}
            cacheContext={{
                classification: authorization.dataClassification,
                residency: authorization.dataResidency,
            }}
        >
            <SkipLink targetId="dev-main-content" />
            <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
                {/* Background Decoration */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <FloatingParticles count={6} />
                    <GradientOrb position="top-right" color="multi" className="opacity-40" />
                    <GradientOrb position="bottom-left" color="accent" className="opacity-25" />
                </div>

                {/* Dev Navigation Shell with Sidebar + Topbar */}
                <div className="relative z-10">
                    <DevelopmentNavigationShell
                        organizationLabel={branding?.companyName ?? null}
                        userEmail={userEmail}
                        mainId="dev-main-content"
                    >
                        <DevelopmentViewSwitcher>
                            {children}
                        </DevelopmentViewSwitcher>
                    </DevelopmentNavigationShell>
                </div>

                {/* Floating Theme Switcher */}
                <div className="fixed bottom-24 left-6 z-(--z-toast) animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="rounded-full shadow-lg shadow-primary/10 backdrop-blur-md bg-background/50">
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </TenantThemeRegistry>
    );
}
