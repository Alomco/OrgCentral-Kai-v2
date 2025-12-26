import type { ReactNode } from 'react';
import { headers as nextHeaders } from 'next/headers';

import { TenantThemeRegistry } from '@/components/theme/tenant-theme-registry';
import { getOrgBranding } from '@/server/branding/get-org-branding';
import { HrNavigation } from './_components/hr-navigation';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

export default async function HrLayout({ children }: { children: ReactNode }) {
    const headerStore = await nextHeaders();

    const { session, authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:hr:layout',
    });

    const userEmailValue = session.user.email;
    const userEmail = typeof userEmailValue === 'string' && userEmailValue.trim().length > 0
        ? userEmailValue
        : null;

    const branding = await getOrgBranding({
        orgId: authorization.orgId,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    }).catch(() => null);

    const organizationLabel = branding?.companyName ?? null;

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
                    href="#hr-main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-4 focus:z-50 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground"
                >
                    Skip to content
                </a>
                <HrNavigation
                    organizationId={authorization.orgId}
                    organizationLabel={organizationLabel}
                    roleKey={authorization.roleKey}
                    permissions={authorization.permissions}
                    userEmail={userEmail}
                />
                <main id="hr-main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-6 py-6">
                    {children}
                </main>
            </div>
        </TenantThemeRegistry>
    );
}
