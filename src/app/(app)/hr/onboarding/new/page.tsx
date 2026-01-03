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
import { getChecklistTemplatesForUi } from '@/server/use-cases/hr/onboarding/templates/get-checklist-templates.cached';

import { HrPageHeader } from '../../_components/hr-page-header';
import { OnboardingWizardPanel } from '../_components/onboarding-wizard-panel';

function WizardSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
}

export default async function OnboardingWizardPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { member: ['invite'] },
        auditSource: 'ui:hr:onboarding:wizard',
    });

    const canInviteMembers =
        authorization.roleKey === 'hrAdmin' &&
        (hasPermission(authorization.permissions, 'member', 'invite') ||
            hasPermission(authorization.permissions, 'organization', 'update'));

    if (!canInviteMembers) {
        redirect('/access-denied');
    }

    const templatesResult = await getChecklistTemplatesForUi({ authorization });

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
                        <BreadcrumbLink asChild>
                            <Link href="/hr/onboarding">Onboarding</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>New Employee</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Onboard New Employee"
                description="Complete the wizard to invite a new employee to your organization."
                icon={<UserPlus className="h-5 w-5" />}
            />

            <div className="mx-auto max-w-2xl">
                <Suspense fallback={<WizardSkeleton />}>
                    <OnboardingWizardPanel
                        checklistTemplates={templatesResult.templates}
                        canManageTemplates={templatesResult.canManageTemplates}
                    />
                </Suspense>
            </div>
        </div>
    );
}
