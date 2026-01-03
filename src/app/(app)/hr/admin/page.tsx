/**
 * HR Admin Hub Page (Server Component)
 * Single Responsibility: Page-level orchestration with PPR + Suspense
 */

import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import { SettingsIcon } from 'lucide-react';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components';
import { ComplianceReviewQueuePanel } from '../compliance/_components/compliance-review-queue-panel';
import {
    AdminHubTabs,
    LeaveManagementHub,
    AbsenceManagementHub,
    EmployeeManagementHub,
    LeaveHubSkeleton,
    AbsenceHubSkeleton,
    EmployeeHubSkeleton,
    ComplianceHubSkeleton,
} from './_components';
import type { AdminHubTabId } from './_types';

interface AdminPageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function HrAdminPage({ searchParams }: AdminPageProps) {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:admin',
    });

    const params = await searchParams;
    const activeTab = validateTab(params.tab) ?? 'leave';

    return (
        <div className="space-y-6">
            <HrPageHeader
                title="HR Administration"
                description="Manage leave approvals, absence acknowledgments, employees, and compliance"
                icon={<SettingsIcon className="h-6 w-6" />}
            />

            <AdminHubTabs defaultTab={activeTab} />

            <AdminHubContent tab={activeTab} authorization={authorization} />
        </div>
    );
}

interface AdminHubContentProps {
    tab: AdminHubTabId;
    authorization: Parameters<typeof LeaveManagementHub>[0]['authorization'];
}

function AdminHubContent({ tab, authorization }: AdminHubContentProps) {
    switch (tab) {
        case 'leave':
            return (
                <Suspense fallback={<LeaveHubSkeleton />}>
                    <LeaveManagementHub authorization={authorization} />
                </Suspense>
            );
        case 'absences':
            return (
                <Suspense fallback={<AbsenceHubSkeleton />}>
                    <AbsenceManagementHub authorization={authorization} />
                </Suspense>
            );
        case 'employees':
            return (
                <Suspense fallback={<EmployeeHubSkeleton />}>
                    <EmployeeManagementHub authorization={authorization} />
                </Suspense>
            );
        case 'compliance':
            return (
                <Suspense fallback={<ComplianceHubSkeleton />}>
                    <ComplianceReviewQueuePanel authorization={authorization} />
                </Suspense>
            );
        default:
            return (
                <Suspense fallback={<LeaveHubSkeleton />}>
                    <LeaveManagementHub authorization={authorization} />
                </Suspense>
            );
    }
}

function validateTab(value: string | undefined): AdminHubTabId | null {
    if (!value) {return null;}
    const valid: AdminHubTabId[] = ['leave', 'absences', 'employees', 'compliance'];
    return valid.includes(value as AdminHubTabId) ? (value as AdminHubTabId) : null;
}

