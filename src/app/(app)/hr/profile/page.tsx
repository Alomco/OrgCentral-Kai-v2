import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { User } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getEmployeeProfileByUserForUi } from '@/server/use-cases/hr/people/get-employee-profile-by-user.cached';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { buildInitialSelfProfileFormState } from './form-state';
import { ProfileContactCard } from './_components/profile-contact-card';
import { ProfileEditCard } from './_components/profile-edit-card';
import { ProfilePermissionsCard } from './_components/profile-permissions-card';
import { ProfileSummaryCard } from './_components/profile-summary-card';

export default async function HrProfilePage() {
    const headerStore = await nextHeaders();
    const { authorization, session } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:profile',
    });

    const profilePromise = getEmployeeProfileByUserForUi({ authorization, userId: authorization.userId });

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
                        <BreadcrumbPage>My profile</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="My profile"
                description="Employee profile details scoped to the active organization."
                icon={<User className="h-5 w-5" />}
                actions={(
                    <Link className="text-sm font-semibold underline underline-offset-4" href="/hr/policies">
                        Policies
                    </Link>
                )}
            />

            <Suspense fallback={<ProfileContentSkeleton />}>
                <ProfileContent
                    authorization={authorization}
                    sessionEmail={session.user.email}
                    sessionImage={session.user.image}
                    profilePromise={profilePromise}
                />
            </Suspense>
        </div>
    );
}

interface ProfileContentProps {
    authorization: RepositoryAuthorizationContext;
    sessionEmail: string | null | undefined;
    sessionImage: string | null | undefined;
    profilePromise: Promise<{ profile: EmployeeProfile | null }>;
}

async function ProfileContent({
    authorization,
    sessionEmail,
    sessionImage,
    profilePromise,
}: ProfileContentProps) {
    const result = await profilePromise;
    const profile = result.profile;

    if (!profile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Profile unavailable</CardTitle>
                    <CardDescription>We could not find a profile linked to your account yet.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Contact your HR admin to link or create your employee profile.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <ProfileSummaryCard
                    className="lg:col-span-2"
                    profile={profile}
                    fallbackEmail={sessionEmail}
                    fallbackImageUrl={sessionImage}
                />
                <ProfilePermissionsCard authorization={authorization} profile={profile} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <ProfileContactCard profile={profile} />
                <ProfileEditCard initialState={buildInitialSelfProfileFormState(profile)} />
            </div>
        </div>
    );
}

function ProfileContentSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-40" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
