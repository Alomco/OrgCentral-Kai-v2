import { Suspense } from 'react';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getHrPolicyForUi } from '@/server/use-cases/hr/policies/get-hr-policy.cached';
import { getPolicyAcknowledgmentForUi } from '@/server/use-cases/hr/policies/get-policy-acknowledgment.cached';
import type { PolicyAcknowledgment } from '@/server/types/hr-ops-types';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { hasPermission } from '@/lib/security/permission-check';

import { formatHumanDate, formatHumanDateTime } from '../../_components/format-date';
import { AcknowledgePolicyForm } from '../_components/acknowledge-policy-form';

function getAcknowledgmentDisplay(policyVersion: string, acknowledgment: PolicyAcknowledgment | null): {
    isAcknowledged: boolean;
    description: string;
} {
    if (!acknowledgment) {
        return { isAcknowledged: false, description: 'Not acknowledged yet.' };
    }

    if (acknowledgment.version === policyVersion) {
        return {
            isAcknowledged: true,
            description: `Acknowledged ${formatHumanDateTime(acknowledgment.acknowledgedAt)}.`,
        };
    }

    return {
        isAcknowledged: false,
        description: `Acknowledged version ${acknowledgment.version} on ${formatHumanDateTime(acknowledgment.acknowledgedAt)}.`,
    };
}

export default function HrPolicyPage({ params }: { params: { policyId: string } }) {
    return (
        <Suspense fallback={<PolicyPageSkeleton />}>
            <PolicyPageContent policyId={params.policyId} />
        </Suspense>
    );
}

async function PolicyPageContent({ policyId }: { policyId: string }) {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'ui:hr:policies:get',
    });

    const [{ policy }, { acknowledgment }] = await Promise.all([
        getHrPolicyForUi({ authorization, policyId }),
        getPolicyAcknowledgmentForUi({ authorization, policyId, userId: authorization.userId }),
    ]);

    if (!policy) {
        notFound();
    }

    const acknowledgmentDisplay = getAcknowledgmentDisplay(policy.version, acknowledgment);
    const canViewAcknowledgments = hasPermission(authorization.permissions, 'organization', 'update');

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
                            <Link href="/hr/policies">Policies</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{policy.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{policy.category}</Badge>
                        <Badge variant="outline">v{policy.version}</Badge>
                        <Badge variant="outline">{policy.status}</Badge>
                    </div>
                    <h1 className="text-2xl font-semibold break-words">{policy.title}</h1>
                    <div className="text-sm text-muted-foreground">
                        Effective {formatHumanDate(policy.effectiveDate)}
                        {policy.expiryDate ? ` · Expires ${formatHumanDate(policy.expiryDate)}` : ''}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link className="text-sm font-semibold underline underline-offset-4" href="/hr/policies">
                        Back to policies
                    </Link>
                    {canViewAcknowledgments ? (
                        <Link
                            className="text-sm font-semibold underline underline-offset-4"
                            href={`/hr/policies/${policy.id}/acknowledgments`}
                        >
                            Admin acknowledgments
                        </Link>
                    ) : null}
                </div>
            </div>

            {policy.requiresAcknowledgment ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Acknowledgment</CardTitle>
                        <CardDescription>
                            {acknowledgmentDisplay.description} If this is required, confirm below to keep your records up to date.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {acknowledgmentDisplay.isAcknowledged ? (
                            <Badge variant="secondary">Acknowledged</Badge>
                        ) : (
                            <AcknowledgePolicyForm policyId={policy.id} version={policy.version} />
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Acknowledgment</CardTitle>
                        <CardDescription>This policy does not require acknowledgment. No action needed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline">Optional</Badge>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Policy text</CardTitle>
                    <CardDescription>Read the policy below. Use the acknowledgment section above if required.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="whitespace-pre-wrap text-sm leading-6">{policy.content}</div>
                </CardContent>
            </Card>
        </div>
    );
}

function PolicyPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
