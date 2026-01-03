import { unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';

import { OrgBrandingForm } from './_components/org-branding-form';
import { getOrgBranding } from '@/server/branding/get-org-branding';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

export default async function OrgBrandingPage() {
    noStore();

    const headerStore = await headers();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-branding',
        },
    );

    const branding = await getOrgBranding({
        orgId: authorization.orgId,
        residency: authorization.dataResidency,
        classification: authorization.dataClassification,
    });

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Branding</p>
                <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Organization branding</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Set your organization name, colors, and assets.</p>
            </div>

            <OrgBrandingForm branding={branding} />
        </div>
    );
}
