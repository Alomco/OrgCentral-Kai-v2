import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { hasPermission } from '@/lib/security/permission-check';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

export default async function HrLandingPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:hr:landing',
    });

    if (hasPermission(authorization.permissions, 'employeeProfile', 'read')) {
        redirect('/hr/dashboard');
    }

    if (
        hasPermission(authorization.permissions, 'audit', 'read') ||
        hasPermission(authorization.permissions, 'residency', 'enforce')
    ) {
        redirect('/hr/compliance');
    }

    redirect('/access-denied');
}

