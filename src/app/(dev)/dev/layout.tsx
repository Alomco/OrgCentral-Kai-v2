import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { TenantThemeRegistry } from '@/components/theme/tenant-theme-registry';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getOrgBranding } from '@/server/branding/get-org-branding';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    ROLE_DASHBOARD_PATHS,
} from '@/server/ui/auth/role-redirect';

import { AdminNavigation } from '@/app/(admin)/admin/_components/admin-navigation';

export default async function DevelopmentLayout({ children }: { children: ReactNode }) {
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
            <div className="min-h-screen bg-background text-foreground">
                <a
                    href="#dev-main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-4 focus:z-50 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground"
                >
                    Skip to content
                </a>
                <AdminNavigation
                    organizationId={authorization.orgId}
                    organizationLabel={branding?.companyName ?? null}
                    roleKey={authorization.roleKey}
                    permissions={authorization.permissions}
                    userEmail={userEmail}
                />
                <main id="dev-main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-6 py-6">
                    {children}
                </main>
            </div>
        </TenantThemeRegistry>
    );
}

