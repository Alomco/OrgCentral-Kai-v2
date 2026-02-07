import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoButton } from '@/components/ui/info-button';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PLATFORM_IMPERSONATION } from '@/server/repositories/cache-scopes';
import { listImpersonationRequestsService, listImpersonationSessionsService } from '@/server/services/platform/admin/impersonation-service';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { ImpersonationBreakGlassForm } from './_components/impersonation-break-glass-form';
import { RequestImpersonationForm } from './_components/request-impersonation-form';
import { ApproveImpersonationForm } from './_components/approve-impersonation-form';
import { StopImpersonationForm } from './_components/stop-impersonation-form';

export const metadata: Metadata = {
    title: 'User Impersonation - OrgCentral',
    description: 'Audited, time-boxed impersonation sessions for support.',
};

export default async function UserImpersonationPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformImpersonation: ['read'] },
            auditSource: 'ui:admin:impersonation',
        },
    );

    const { requests, sessions } = await loadImpersonationData(authorization);

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">User impersonation</h1>
                <p className="text-sm text-muted-foreground">
                    Break-glass, MFA-verified, and time-boxed access for support investigations.
                </p>
            </header>

            <ImpersonationBreakGlassForm />
            <RequestImpersonationForm />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Pending requests</span>
                        <InfoButton
                            label="Impersonation approvals"
                            sections={[
                                { label: 'What', text: 'Requests awaiting approval.' },
                                { label: 'Prereqs', text: 'Break-glass approval and MFA.' },
                                { label: 'Next', text: 'Review scope, approve or reject.' },
                                { label: 'Compliance', text: 'Approvals are time-boxed and audited.' },
                            ]}
                        />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {requests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No impersonation requests.</p>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="rounded-xl border border-border/40 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{request.targetUserId}</p>
                                        <p className="text-xs text-muted-foreground">Org: {request.targetOrgId}</p>
                                    </div>
                                    <Badge variant="secondary">{request.status}</Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">Reason: {request.reason}</p>
                                {request.status === 'PENDING' ? (
                                    <div className="mt-3">
                                        <ApproveImpersonationForm requestId={request.id} />
                                    </div>
                                ) : null}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Active sessions</span>
                        <InfoButton
                            label="Active impersonation sessions"
                            sections={[
                                { label: 'What', text: 'Time-limited sessions in progress.' },
                                { label: 'Prereqs', text: 'Approved request with an active session.' },
                                { label: 'Next', text: 'Stop sessions when work is done.' },
                                { label: 'Compliance', text: 'Sessions are logged and auto-expire.' },
                            ]}
                        />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active sessions.</p>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="rounded-xl border border-border/40 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{session.targetUserId}</p>
                                        <p className="text-xs text-muted-foreground">Org: {session.targetOrgId}</p>
                                    </div>
                                    <Badge variant="outline">{session.status}</Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">Expires: {session.expiresAt}</p>
                                {session.status === 'ACTIVE' ? (
                                    <div className="mt-3">
                                        <StopImpersonationForm sessionId={session.id} />
                                    </div>
                                ) : null}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

async function loadImpersonationData(authorization: RepositoryAuthorizationContext) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadImpersonationDataUncached(authorization);
    }

    return loadImpersonationDataCached(authorization);
}

async function loadImpersonationDataCached(authorization: RepositoryAuthorizationContext) {
    'use cache';
    cacheLife('minutes');
    registerCacheTag({
        orgId: authorization.orgId,
        scope: CACHE_SCOPE_PLATFORM_IMPERSONATION,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });

    return loadImpersonationDataUncached(authorization);
}

async function loadImpersonationDataUncached(authorization: RepositoryAuthorizationContext) {
    const [requests, sessions] = await Promise.all([
        listImpersonationRequestsService(authorization),
        listImpersonationSessionsService(authorization),
    ]);

    return { requests, sessions };
}
