import type { ReactNode } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { TenantThemeRegistry } from '@/components/theme/tenant-theme-registry';
import { DevelopmentThemeWidget } from '@/components/dev/DevelopmentThemeWidget';
import { AppClientProviders } from '@/app/(app)/_components/app-client-providers';
import { getOrgBranding } from '@/server/branding/get-org-branding';
import { getHrNotificationsAction } from '@/server/api-adapters/hr/notifications/get-hr-notifications';
import { buildAppSessionSnapshot, buildOrgBrandingSnapshot } from '@/server/ui/app-context-snapshots';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { FloatingParticles } from '@/components/theme/decorative/particles';
import { GradientOrb } from '@/components/theme/decorative/effects';

export async function AppLayoutShell({ children }: { children: ReactNode }) {
    noStore();

    const headerStore = await headers();

    const { session, authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:app-layout',
        },
    );

    const [brandingResult, notificationsResult] = await Promise.allSettled([
        getOrgBranding({
            orgId: authorization.orgId,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        }),
        getHrNotificationsAction({
            authorization,
            userId: session.user.id,
            filters: { limit: 5 },
        }),
    ]);

    const branding = brandingResult.status === 'fulfilled' ? brandingResult.value : null;
    const { notifications = [], unreadCount = 0 } = 
        notificationsResult.status === 'fulfilled' ? notificationsResult.value : {};

    const sessionSnapshot = buildAppSessionSnapshot(session, authorization);
    const brandingSnapshot = buildOrgBrandingSnapshot(branding);
    const showDevelopmentThemeWidget = process.env.NODE_ENV === 'development';

    return (
        <TenantThemeRegistry
            orgId={authorization.orgId}
            cacheContext={{
                classification: authorization.dataClassification,
                residency: authorization.dataResidency,
            }}
        >
            <AppSidebar
                session={session}
                authorization={authorization}
                organizationLabel={branding?.companyName ?? null}
            />
            <SidebarInset className="flex h-svh flex-col relative min-h-0 transition-colors duration-300">
                {/* 🌌 Background Decoration */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <FloatingParticles count={6} />
                    <GradientOrb position="top-right" color="primary" className="opacity-40" />
                    <GradientOrb position="bottom-left" color="accent" className="opacity-20" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                    <AppHeader 
                        session={session} 
                        authorization={authorization} 
                        branding={branding} 
                        notifications={notifications}
                        unreadCount={unreadCount}
                    />
                    <main className="min-h-0 flex-1 overflow-y-auto">
                        <AppClientProviders session={sessionSnapshot} branding={brandingSnapshot}>
                            {children}
                        </AppClientProviders>
                        <DevelopmentThemeWidget
                            enabled={showDevelopmentThemeWidget}
                            orgId={authorization.orgId}
                        />
                    </main>
                </div>
            </SidebarInset>
        </TenantThemeRegistry>
    );
}
