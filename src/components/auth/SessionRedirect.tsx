/**
 * Session Redirect Component
 * 
 * Server Component that checks authentication and redirects
 * authenticated users to their dashboard.
 * Wrapped in Suspense to avoid blocking page render.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    ROLE_DASHBOARD_PATHS,
} from '@/server/ui/auth/role-redirect';

export async function SessionRedirect() {
    const headerStore = await headers();

    // Try to get session without redirecting
    type SessionContextResult = Awaited<ReturnType<typeof getSessionContext>>;

    const sessionResult: SessionContextResult | null = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:homepage',
    }).catch((): null => null);

    // If user is authenticated, redirect to appropriate dashboard
    if (sessionResult) {
        const { authorization } = sessionResult;
        const membershipSnapshot = await getMembershipRoleSnapshot(
            authorization.orgId,
            authorization.userId
        );
        const dashboardRole = membershipSnapshot
            ? resolveRoleDashboard(membershipSnapshot)
            : 'employee';

        redirect(ROLE_DASHBOARD_PATHS[dashboardRole]);
    }

    // No redirect needed, return null
    return null;
}
