import Image from 'next/image';
import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getEmployeeProfileByUserForUi } from '@/server/use-cases/hr/people/get-employee-profile-by-user.cached';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { ProfileContainer } from './_components/profile-container';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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
                        <BreadcrumbPage>Profile</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Suspense fallback={<ProfileContentSkeleton />}>
                <ProfileContent
                    profilePromise={profilePromise}
                    authorization={authorization}
                    userImage={session.user.image}
                />
            </Suspense>
        </div>
    );
}

interface ProfileContentProps {
    profilePromise: Promise<{ profile: EmployeeProfile | null }>;
    authorization: RepositoryAuthorizationContext;
}

async function ProfileContent({ profilePromise, authorization, userImage }: ProfileContentProps & { userImage?: string | null }) {
    const result = await profilePromise;
    const profile = result.profile;

    if (!profile) {
        return (
            <Card className="glass-card mt-10">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-4xl mb-4">
                        {userImage ? (
                            <Image src={userImage} alt="User" width={80} height={80} className="h-full w-full rounded-full object-cover" />
                        ) : '?'}
                    </div>
                    <h2 className="text-2xl font-bold">Profile Unavailable</h2>
                    <p className="text-muted-foreground mt-2 max-w-md">
                        We could not find an employee profile linked to your user account. Please contact your HR administrator.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <ProfileLayout profile={profile} authorization={authorization} userImage={userImage} />
    );
}

/**
 * Client-side interactive wrapper for the profile layout.
 * Allows managing state for the Edit Sheet without making the whole page client-side.
 */
function ProfileLayout({ profile, authorization, userImage }: { profile: EmployeeProfile, authorization: RepositoryAuthorizationContext, userImage?: string | null }) {

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ProfileContainer profile={profile} authorization={authorization} userImage={userImage} />
        </div>
    );
}

function ProfileContentSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-64 w-full rounded-3xl bg-muted/50" />
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-40 col-span-2 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
    );
}
