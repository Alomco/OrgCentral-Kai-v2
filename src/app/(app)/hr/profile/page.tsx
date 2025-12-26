import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { getEmployeeProfileByUserForUi } from '@/server/use-cases/hr/people/get-employee-profile-by-user.cached';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { HrPageHeader } from '../_components/hr-page-header';
import { formatHumanDateTime } from '../_components/format-date';

function coerceDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function formatDateTime(value: Date | string | null | undefined): string {
    const date = coerceDate(value);
    return date ? formatHumanDateTime(date) : '—';
}

function formatPhoneNumbers(phone: EmployeeProfile['phone']): string {
    if (!phone) {
        return '—';
    }

    const parts = [
        phone.work ? `Work: ${phone.work}` : null,
        phone.mobile ? `Mobile: ${phone.mobile}` : null,
        phone.home ? `Home: ${phone.home}` : null,
    ].filter((part): part is string => typeof part === 'string');

    return parts.length > 0 ? parts.join(' · ') : '—';
}

export default async function HrProfilePage() {
    const headerStore = await nextHeaders();
    const { authorization, session } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:profile',
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

            <Suspense fallback={<IdentityCardSkeleton />}>
                <IdentityCard authorization={authorization} fallbackEmail={session.user.email} />
            </Suspense>

            <Card>
                <CardHeader>
                    <CardTitle>Tenant scope</CardTitle>
                    <CardDescription>Derived from your organization membership.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary">Org {authorization.orgId}</Badge>
                    <Badge variant="outline">{authorization.roleKey}</Badge>
                    <Badge variant="outline">{authorization.dataResidency}</Badge>
                    <Badge variant="outline">{authorization.dataClassification}</Badge>
                </CardContent>
            </Card>
        </div>
    );
}

async function IdentityCard({
    authorization,
    fallbackEmail,
}: {
    authorization: Parameters<typeof getEmployeeProfileByUserForUi>[0]['authorization'];
    fallbackEmail: string | null | undefined;
}) {
    const result = await getEmployeeProfileByUserForUi({ authorization, userId: authorization.userId });
    const profile = result.profile;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Identity</CardTitle>
                <CardDescription>Basic information for HR workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {profile ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{profile.employmentStatus}</Badge>
                            <Badge variant="outline">{profile.employmentType}</Badge>
                            <Badge variant="outline">Employee {profile.employeeNumber}</Badge>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">Name</div>
                                <div className="mt-1">
                                    {profile.displayName ?? (`${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || '—')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">Work email</div>
                                <div className="mt-1">{profile.email ?? fallbackEmail ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">Job title</div>
                                <div className="mt-1">{profile.jobTitle ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">Department</div>
                                <div className="mt-1">{profile.departmentId ?? '—'}</div>
                            </div>
                            <div className="sm:col-span-2">
                                <div className="text-xs font-medium text-muted-foreground">Phone</div>
                                <div className="mt-1">{formatPhoneNumbers(profile.phone)}</div>
                            </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">Created</div>
                                <div className="mt-1 text-muted-foreground">{formatDateTime(profile.createdAt)}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-muted-foreground">Updated</div>
                                <div className="mt-1 text-muted-foreground">{formatDateTime(profile.updatedAt)}</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-muted-foreground">
                        No employee profile is linked to your account for this organization yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function IdentityCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Identity</CardTitle>
                <CardDescription>Basic information for HR workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
}
