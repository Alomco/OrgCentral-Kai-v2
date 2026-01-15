import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { ModernAdminDashboardControlCenter } from './_components/modern-admin-dashboard-control-center';

export const metadata: Metadata = {
    title: 'Global Admin Dashboard - OrgCentral',
    description: 'Platform-wide controls for tenant governance and security.',
};

export default async function AdminDashboardPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:admin:dashboard',
        },
    );

    return <ModernAdminDashboardControlCenter authorization={authorization} />;
}
