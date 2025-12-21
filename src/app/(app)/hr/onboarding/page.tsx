import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';

import { Skeleton } from '@/components/ui/skeleton';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { ChecklistTemplatesPanel } from './_components/checklist-templates-panel';
import { InviteEmployeePanel } from './_components/invite-employee-panel';

function PanelSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full" />
        </div>
    );
}

export default async function HrOnboardingPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['read'] },
        auditSource: 'ui:hr:onboarding',
    });

    return (
        <div className="space-y-6">
            <HrPageHeader
                title="Onboarding"
                description="Invite employees and manage onboarding checklists for your organization."
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<PanelSkeleton />}>
                    <InviteEmployeePanel authorization={authorization} />
                </Suspense>

                <Suspense fallback={<PanelSkeleton />}>
                    <ChecklistTemplatesPanel authorization={authorization} />
                </Suspense>
            </div>
        </div>
    );
}

