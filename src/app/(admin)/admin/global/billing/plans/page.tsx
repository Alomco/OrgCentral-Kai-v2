import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { registerCacheTag } from '@/server/lib/cache-tags';
import { listBillingPlansService, listBillingAssignmentsService } from '@/server/services/platform/admin/billing-plan-service';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

import { CreateBillingPlanForm } from './_components/create-billing-plan-form';
import { AssignBillingPlanForm } from './_components/assign-billing-plan-form';
import { BillingPlanStatusForm } from './_components/billing-plan-status-form';

export const metadata: Metadata = {
    title: 'Global Billing Plans - OrgCentral',
    description: 'Manage subscription plans and assignments.',
};

export default async function BillingPlansPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBillingPlans: ['read'] },
            auditSource: 'ui:admin:billing-plans',
        },
    );

    const { plans, assignments } = await loadBillingPlans(authorization);

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Billing plans</h1>
                <p className="text-sm text-muted-foreground">
                    Control Stripe-backed plans and tenant assignments.
                </p>
            </header>

            <CreateBillingPlanForm />
            <AssignBillingPlanForm />

            <Card>
                <CardHeader>
                    <CardTitle>Plan catalog</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {plans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No plans configured yet.</p>
                    ) : (
                        plans.map((plan) => (
                            <div key={plan.id} className="rounded-xl border border-border/40 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                                        <p className="text-xs text-muted-foreground">{plan.stripePriceId}</p>
                                    </div>
                                    <Badge variant="secondary">{plan.status}</Badge>
                                </div>
                                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                                    <span>Amount: {plan.amountCents} {plan.currency}</span>
                                    <span>Cadence: {plan.cadence}</span>
                                    <span>Effective: {plan.effectiveFrom}</span>
                                </div>
                                <div className="mt-3">
                                    <BillingPlanStatusForm planId={plan.id} />
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {assignments.length === 0 ? (
                        <p>No assignments recorded yet.</p>
                    ) : (
                        assignments.map((assignment) => (
                            <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                                <span>Tenant: {assignment.tenantId}</span>
                                <span>Plan: {assignment.planId}</span>
                                <Badge variant="outline">{assignment.status}</Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

async function loadBillingPlans(authorization: RepositoryAuthorizationContext) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadBillingPlansUncached(authorization);
    }

    return loadBillingPlansCached(authorization);
}

async function loadBillingPlansCached(authorization: RepositoryAuthorizationContext) {
    'use cache';
    cacheLife('minutes');
    registerCacheTag({
        orgId: authorization.orgId,
        scope: 'platform:billing-plans',
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });
    registerCacheTag({
        orgId: authorization.orgId,
        scope: 'platform:billing-assignments',
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    });

    return loadBillingPlansUncached(authorization);
}

async function loadBillingPlansUncached(authorization: RepositoryAuthorizationContext) {
    const [plans, assignments] = await Promise.all([
        listBillingPlansService(authorization),
        listBillingAssignmentsService(authorization),
    ]);

    return { plans, assignments };
}
