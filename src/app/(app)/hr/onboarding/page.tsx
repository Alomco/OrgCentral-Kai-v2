import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { hasPermission } from '@/lib/security/permission-check';

import { HrPageHeader } from '../_components/hr-page-header';
import { ChecklistTemplatesPanel } from './_components/checklist-templates-panel';
import { InviteEmployeePanel } from './_components/invite-employee-panel';
import { OnboardingInvitationsPanel } from './_components/onboarding-invitations-panel';

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

    const canInviteMembers =
        hasPermission(authorization.permissions, 'member', 'invite') ||
        hasPermission(authorization.permissions, 'organization', 'update');
    const canManageTemplates = hasPermission(authorization.permissions, 'organization', 'update');

    if (!canInviteMembers && !canManageTemplates) {
        redirect('/access-denied');
    }

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Onboarding</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Onboarding"
                description="Invite employees and manage onboarding checklists for your organization."
                icon={<UserPlus className="h-5 w-5" />}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                {canInviteMembers ? (
                    <Suspense fallback={<PanelSkeleton />}>
                        <InviteEmployeePanel authorization={authorization} />
                    </Suspense>
                ) : null}

                {canManageTemplates ? (
                    <Suspense fallback={<PanelSkeleton />}>
                        <ChecklistTemplatesPanel authorization={authorization} />
                    </Suspense>
                ) : null}
            </div>

            {canInviteMembers ? (
                <Suspense fallback={<PanelSkeleton />}>
                    <OnboardingInvitationsPanel authorization={authorization} />
                </Suspense>
            ) : null}
        </div>
    );
}
