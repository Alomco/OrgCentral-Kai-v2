import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { HrCardSkeleton } from '../_components/hr-card-skeleton';
import { TrainingRecordsPanel } from './_components/training-records-panel';
import { EnrollTrainingForm } from './_components/enroll-training-form';
import { buildInitialEnrollTrainingFormState } from './form-state';

export default async function HrTrainingPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:training',
        },
    );

    const initialFormState = buildInitialEnrollTrainingFormState();

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
                        <BreadcrumbPage>Training</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Training"
                description="Track your training courses and certifications."
                icon={<GraduationCap className="h-5 w-5" />}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <EnrollTrainingForm
                    authorization={authorization}
                    initialState={initialFormState}
                />

                <Suspense fallback={<HrCardSkeleton variant="table" />}>
                    <TrainingRecordsPanel
                        authorization={authorization}
                        userId={authorization.userId}
                    />
                </Suspense>
            </div>
        </div>
    );
}
