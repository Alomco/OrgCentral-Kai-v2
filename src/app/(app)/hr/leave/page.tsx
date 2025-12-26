import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getPeopleService } from '@/server/services/hr/people/people-service.provider';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { buildInitialLeaveRequestFormState } from './form-state';
import { LeaveRequestForm } from './_components/leave-request-form';
import { LeaveRequestsPanel } from './_components/leave-requests-panel';

function buildTodayDateInputValue(): string {
    return new Date().toISOString().slice(0, 10);
}

function LeaveRequestsSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
}

export default async function HrLeavePage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:leave',
    });

    const peopleService = getPeopleService();
    const profileResult = await peopleService.getEmployeeProfileByUser({
        authorization,
        payload: { userId: authorization.userId },
    });

    const profile = profileResult.profile;
    const employeeId = authorization.userId;

    const initialState = buildInitialLeaveRequestFormState({
        leaveType: '',
        startDate: buildTodayDateInputValue(),
        endDate: '',
        totalDays: 1,
        isHalfDay: false,
        reason: '',
    });

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
                        <BreadcrumbPage>Leave</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Leave"
                description={profile?.displayName
                    ? `Request leave for ${profile.displayName}.`
                    : 'Request leave and view recent submissions.'}
                icon={<CalendarDays className="h-5 w-5" />}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <LeaveRequestForm initialState={initialState} />

                <Suspense fallback={<LeaveRequestsSkeleton />}>
                    <LeaveRequestsPanel authorization={authorization} employeeId={employeeId} />
                </Suspense>
            </div>
        </div>
    );
}
