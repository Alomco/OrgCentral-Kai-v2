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
import { buildAppSessionSnapshot, buildOrgBrandingSnapshot } from '@/server/ui/app-context-snapshots';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import type { OrgBranding } from '@/server/types/branding-types';

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
    const branding: OrgBranding | null = await getOrgBranding({
        orgId: authorization.orgId,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    }).catch(() => null);

    const sessionSnapshot = buildAppSessionSnapshot(session, authorization);
    const brandingSnapshot = buildOrgBrandingSnapshot(branding);
    const showDevelopmentThemeWidget =
        process.env.NODE_ENV === 'development' && authorization.developmentSuperAdmin === true;

    return (
        <TenantThemeRegistry
            orgId={authorization.orgId}
            cacheContext={{
                classification: authorization.dataClassification,
                residency: authorization.dataResidency,
            }}
        >
            <AppSidebar session={session} authorization={authorization} />
            <SidebarInset className="flex flex-col">
                <AppHeader session={session} authorization={authorization} branding={branding} />
                <main className="flex-1 overflow-y-auto">
                    <AppClientProviders session={sessionSnapshot} branding={brandingSnapshot}>
                        {children}
                    </AppClientProviders>
                    <DevelopmentThemeWidget
                        enabled={showDevelopmentThemeWidget}
                        orgId={authorization.orgId}
                    />
                </main>
            </SidebarInset>
        </TenantThemeRegistry>
    );
}
