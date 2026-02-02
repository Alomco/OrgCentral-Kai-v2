import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { listSupportTicketsService } from '@/server/services/platform/admin/support-ticket-service';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { CreateSupportTicketForm } from './_components/create-support-ticket-form';
import { SupportTicketUpdateForm } from './_components/support-ticket-update-form';

export const metadata: Metadata = {
    title: 'Support Tickets - OrgCentral',
    description: 'Global support ticket triage console.',
};

export default async function SupportTicketsPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformSupport: ['read'] },
            auditSource: 'ui:admin:support-tickets',
        },
    );

    const tickets = await loadSupportTickets(authorization);

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Support tickets</h1>
                <p className="text-sm text-muted-foreground">
                    Triage incoming requests with tenant context and SLA monitoring.
                </p>
            </header>

            <CreateSupportTicketForm />

            <Card>
                <CardHeader>
                    <CardTitle>Open tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No support tickets logged yet.</p>
                    ) : (
                        tickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-xl border border-border/40 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                                        <p className="text-xs text-muted-foreground">Tenant: {ticket.tenantId}</p>
                                    </div>
                                    <Badge variant={ticket.status === 'RESOLVED' ? 'secondary' : 'default'}>
                                        {ticket.status}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">{ticket.description}</p>
                                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                                    <span>Severity: {ticket.severity}</span>
                                    <span>Requester: {ticket.requesterEmail}</span>
                                    <span>SLA breached: {ticket.slaBreached ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="mt-3">
                                    <SupportTicketUpdateForm ticketId={ticket.id} status={ticket.status} />
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

async function loadSupportTickets(authorization: RepositoryAuthorizationContext) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadSupportTicketsUncached(authorization);
    }

    return loadSupportTicketsCached(authorization);
}

async function loadSupportTicketsCached(authorization: RepositoryAuthorizationContext) {
    'use cache';
    cacheLife('minutes');
    registerCacheTag({
        orgId: authorization.orgId,
        scope: 'platform:support',
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });

    return loadSupportTicketsUncached(authorization);
}

async function loadSupportTicketsUncached(authorization: RepositoryAuthorizationContext) {
    return listSupportTicketsService(authorization);
}
