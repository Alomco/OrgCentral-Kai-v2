import { Suspense } from 'react';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';

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
import { listPolicyAcknowledgmentsForUi } from '@/server/use-cases/hr/policies/list-policy-acknowledgments.cached';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { formatHumanDateTime } from '../../../_components/format-date';

function formatUserId(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= 12) {
        return trimmed;
    }
    return `${trimmed.slice(0, 8)}…${trimmed.slice(-4)}`;
}

export default function HrPolicyAcknowledgmentsPage({ params }: { params: { policyId: string } }) {
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
                        <BreadcrumbLink asChild>
                            <Link href={`/hr/policies/${params.policyId}`}>Policy</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Acknowledgments</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Policy acknowledgments</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Admin view of who has acknowledged this policy.
                    </p>
                </div>
                <Link className="text-sm font-semibold underline underline-offset-4" href={`/hr/policies/${params.policyId}`}>
                    Back to policy
                </Link>
            </div>

            <Suspense fallback={<AcknowledgmentsSkeleton />}>
                <AcknowledgmentsCard policyId={params.policyId} />
            </Suspense>
        </div>
    );
}

async function AcknowledgmentsCard({ policyId }: { policyId: string }) {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:policies:acknowledgments:list',
    });

    let response:
        | { kind: 'ready'; acknowledgments: Awaited<ReturnType<typeof listPolicyAcknowledgmentsForUi>>['acknowledgments'] }
        | { kind: 'error'; message: string } = { kind: 'ready', acknowledgments: [] };

    try {
        const { acknowledgments } = await listPolicyAcknowledgmentsForUi({ authorization, policyId });
        response = { kind: 'ready', acknowledgments };
    } catch (error: unknown) {
        response = {
            kind: 'error',
            message: error instanceof Error ? error.message : 'Unable to load acknowledgments.',
        };
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Acknowledgments</CardTitle>
                <CardDescription>Requires `orgAdmin` role.</CardDescription>
            </CardHeader>
            <CardContent>
                {response.kind === 'error' ? (
                    <div className="text-sm text-destructive">{response.message}</div>
                ) : response.acknowledgments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No acknowledgments recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b text-left">
                                <tr>
                                    <th className="px-2 py-2 font-medium">User</th>
                                    <th className="px-2 py-2 font-medium">Version</th>
                                    <th className="px-2 py-2 font-medium">Acknowledged</th>
                                </tr>
                            </thead>
                            <tbody>
                                {response.acknowledgments.map((acknowledgment) => (
                                    <tr
                                        key={acknowledgment.id}
                                        className="border-b last:border-b-0 hover:bg-muted/50"
                                    >
                                        <td className="px-2 py-2">
                                            <Badge variant="outline" title={acknowledgment.userId}>
                                                {formatUserId(acknowledgment.userId)}
                                            </Badge>
                                        </td>
                                        <td className="px-2 py-2 text-muted-foreground">{acknowledgment.version}</td>
                                        <td className="px-2 py-2 text-muted-foreground">
                                            {formatHumanDateTime(acknowledgment.acknowledgedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AcknowledgmentsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acknowledgments</CardTitle>
                <CardDescription>Requires `orgAdmin` role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}
