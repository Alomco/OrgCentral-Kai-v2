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
import { getWorkflowTemplatesForUi } from '@/server/use-cases/hr/onboarding/workflows/get-workflow-templates.cached';
import { getEmailSequenceTemplatesForUi } from '@/server/use-cases/hr/onboarding/email-sequences/get-email-sequence-templates.cached';
import { getDocumentTemplatesForUi } from '@/server/use-cases/records/documents/list-document-templates.cached';
import { listEmployeeDirectoryForUi } from '@/server/use-cases/hr/people/list-employee-directory.cached';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { getDepartmentService } from '@/server/services/org/departments/department-service.provider';
import { getHrSettingsForUi } from '@/server/use-cases/hr/settings/get-hr-settings.cached';
import { normalizeLeaveTypeOptions } from '@/server/lib/hr/leave-type-options';
import { assertOnboardingInviteSender } from '@/server/security/authorization/hr-guards/onboarding';

import { HrPageHeader } from '../../_components/hr-page-header';
import { OnboardingWizardPanel } from '../_components/onboarding-wizard-panel';
import type { ManagerOption } from '../wizard/wizard.types';
import type { LeaveType } from '../wizard/assignments-step';
import type { Department } from '../wizard/job-step';

function WizardSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
}

function buildManagerOptions(profiles: EmployeeProfile[]): ManagerOption[] {
    const options = profiles
        .filter((profile) => profile.employeeNumber.trim().length > 0)
        .map((profile) => ({
            employeeNumber: profile.employeeNumber,
            displayName: resolveManagerLabel(profile),
            email: profile.email ?? profile.personalEmail ?? null,
        }));

    return options.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function resolveManagerLabel(profile: EmployeeProfile): string {
    const displayName = profile.displayName?.trim();
    if (displayName) {
        return displayName;
    }

    const name = [profile.firstName, profile.lastName]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .join(' ')
        .trim();
    if (name) {
        return name;
    }

    const email = profile.email?.trim() ?? profile.personalEmail?.trim();
    if (email) {
        return email;
    }

    return profile.employeeNumber;
}

export default async function OnboardingWizardPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { member: ['invite'] },
        auditSource: 'ui:hr:onboarding:wizard',
    });

    const canInviteMembers =
        hasPermission(authorization.permissions, 'member', 'invite') ||
        hasPermission(authorization.permissions, 'organization', 'update');
    let canManageOnboarding = false;
    try {
        await assertOnboardingInviteSender({ authorization });
        canManageOnboarding = true;
    } catch {
        canManageOnboarding = false;
    }

    if (!canInviteMembers) {
        redirect('/access-denied');
    }

    const templatesResult = await getChecklistTemplatesForUi({ authorization, type: 'onboarding' });
    let managers: ManagerOption[] = [];
    try {
        const managerResult = await listEmployeeDirectoryForUi({
            authorization,
            page: 1,
            pageSize: 200,
            filters: { employmentStatus: 'ACTIVE' },
        });
        managers = buildManagerOptions(managerResult.profiles);
    } catch {
        managers = [];
    }

    let departments: Department[] = [];
    try {
        const departmentResult = await getDepartmentService().getDepartments({ authorization });
        departments = departmentResult.departments.map((department) => ({
            id: department.id,
            name: department.name,
        }));
    } catch {
        departments = [];
    }

    let leaveTypes: LeaveType[] = [];
    try {
        const hrSettingsResult = await getHrSettingsForUi({ authorization, orgId: authorization.orgId });
        leaveTypes = normalizeLeaveTypeOptions(hrSettingsResult.settings.leaveTypes ?? undefined);
    } catch {
        leaveTypes = [];
    }

    const workflowTemplatesResult = await getWorkflowTemplatesForUi({
        authorization,
        templateType: 'ONBOARDING',
        isActive: true,
    });

    const emailSequenceTemplatesResult = await getEmailSequenceTemplatesForUi({
        authorization,
        trigger: 'ONBOARDING_INVITE',
        isActive: true,
    });

    const documentTemplatesResult = await getDocumentTemplatesForUi({
        authorization,
        isActive: true,
        type: 'ONBOARDING',
    });

    const provisioningTaskOptions = [
        { value: 'ACCOUNT', label: 'Create user account' },
        { value: 'EQUIPMENT', label: 'Provision equipment' },
        { value: 'ACCESS', label: 'Grant system access' },
        { value: 'LICENSE', label: 'Assign licenses' },
        { value: 'SOFTWARE', label: 'Install software' },
    ];

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
                        roleOptions={[{ name: 'member', description: 'Standard employee access.' }]}
                        defaultRole="member"
                        checklistTemplates={templatesResult.templates}
                        workflowTemplates={workflowTemplatesResult.templates}
                        emailSequenceTemplates={emailSequenceTemplatesResult.templates}
                        documentTemplates={documentTemplatesResult.templates}
                        provisioningTaskOptions={provisioningTaskOptions}
                        departments={departments}
                        managers={managers}
                        leaveTypes={leaveTypes}
                        canManageTemplates={templatesResult.canManageTemplates}
                        canManageOnboarding={canManageOnboarding}
                        enableEmailCheck={canManageOnboarding}
                        cancelPath="/hr/onboarding"
                    />
                </Suspense>
            </div>
        </div>
    );
}
