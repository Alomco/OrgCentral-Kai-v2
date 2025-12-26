import { Suspense } from 'react';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';
import { ShieldCheck } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getComplianceStatusService } from '@/server/services/hr/compliance/compliance-status.service.provider';

import { HrPageHeader } from '../_components/hr-page-header';
import { ComplianceItemsPanel } from './_components/compliance-items-panel';
import { ComplianceReviewQueuePanel } from './_components/compliance-review-queue-panel';
import { ComplianceTemplatesPanel } from './_components/compliance-templates-panel';

export default async function HrCompliancePage() {
    const headerStore = await nextHeaders();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:compliance',
            action: 'read',
            resourceType: 'hr.compliance',
            resourceAttributes: { view: 'page' },
        },
    );

    const complianceService = getComplianceStatusService();
    const status = await complianceService
        .getStatusForUser(authorization, authorization.userId)
        .then((snapshot) => snapshot)
        .catch(() => null);

    const adminAuthorization = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:hr:compliance:review-queue',
            action: 'list',
            resourceType: 'hr.compliance',
            resourceAttributes: { view: 'review-queue' },
        },
    )
        .then((result) => result.authorization)
        .catch(() => null);

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Compliance</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Compliance"
                description={
                    status
                        ? `Status: ${status.status} • ${String(status.itemCount)} item(s)`
                        : 'Track assigned compliance items, expirations, and reminders.'
                }
                icon={<ShieldCheck className="h-5 w-5" />}
            />

            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading compliance items…</div>}>
                <ComplianceItemsPanel authorization={authorization} userId={authorization.userId} />
            </Suspense>

            {adminAuthorization ? (
                <div className="space-y-6">
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading templates…</div>}>
                        <ComplianceTemplatesPanel authorization={adminAuthorization} />
                    </Suspense>
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading review queue…</div>}>
                        <ComplianceReviewQueuePanel authorization={adminAuthorization} />
                    </Suspense>
                </div>
            ) : null}
        </div>
    );
}

