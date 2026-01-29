import { Suspense } from 'react';
import Link from 'next/link';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { PrismaAbacPolicyRepository } from '@/server/repositories/prisma/org/abac/prisma-abac-policy-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { CACHE_SCOPE_ABAC_POLICIES, CACHE_SCOPE_PERMISSIONS } from '@/server/repositories/cache-scopes';
import { getPermissionResourceService } from '@/server/services/org';
import type { AbacPolicy } from '@/server/security/abac-types';
import type { PermissionResource } from '@/server/types/security-types';
import { getAbacPolicies } from '@/server/use-cases/org/abac/get-abac-policies';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

import { LegacyMappingPanel } from './_components/legacy-mapping-panel';
import { PermissionResourcePanel } from './_components/permission-resource-panel';

export default async function OrgPermissionsPage() {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-permissions:read',
            action: 'org.permissionResource.list',
            resourceType: 'org.permissionResource',
        },
    );

    const resourcesPromise = getPermissionResourcesForUi(authorization);
    const policiesPromise = getAbacPoliciesForUi(authorization);

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[oklch(var(--muted-foreground))]">Access</p>
                <h1 className="text-2xl font-semibold text-[oklch(var(--foreground))]">
                    Permissions registry
                </h1>
                <p className="text-sm text-[oklch(var(--muted-foreground))]">
                    Govern access by defining resources, actions, and ABAC policies for this organization.
                </p>
            </div>

            <div className="space-y-6">
                <Suspense fallback={<PanelSkeleton />}>
                    <AbacSummaryPanel policiesPromise={policiesPromise} />
                </Suspense>

                <Suspense fallback={<PanelSkeleton />}>
                    <PermissionResourcePanel orgId={authorization.orgId} resourcesPromise={resourcesPromise} />
                </Suspense>

                <LegacyMappingPanel />
            </div>
        </div>
    );
}

async function getPermissionResourcesForUi(
    authorization: RepositoryAuthorizationContext,
): Promise<PermissionResource[]> {
    async function loadCached(input: RepositoryAuthorizationContext): Promise<PermissionResource[]> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            input.orgId,
            CACHE_SCOPE_PERMISSIONS,
            input.dataClassification,
            input.dataResidency,
        );

        return getPermissionResourceService().listResources({ authorization: input });
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return getPermissionResourceService().listResources({ authorization });
    }

    return loadCached(authorization);
}

async function getAbacPoliciesForUi(
    authorization: RepositoryAuthorizationContext,
): Promise<AbacPolicy[]> {
    async function loadCached(input: RepositoryAuthorizationContext): Promise<AbacPolicy[]> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            input.orgId,
            CACHE_SCOPE_ABAC_POLICIES,
            input.dataClassification,
            input.dataResidency,
        );

        const { policies } = await getAbacPolicies(
            { policyRepository: new PrismaAbacPolicyRepository() },
            { authorization: input },
        );
        return policies;
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const { policies } = await getAbacPolicies(
            { policyRepository: new PrismaAbacPolicyRepository() },
            { authorization },
        );
        return policies;
    }

    return loadCached(authorization);
}

async function AbacSummaryPanel({ policiesPromise }: { policiesPromise: Promise<AbacPolicy[]> }) {
    const policies = await policiesPromise;
    const allowCount = policies.filter((policy) => policy.effect === 'allow').length;
    const denyCount = policies.filter((policy) => policy.effect === 'deny').length;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <CardTitle>ABAC policies</CardTitle>
                        <CardDescription>Review and edit attribute-based access policies.</CardDescription>
                    </div>
                    <Button asChild size="sm" variant="secondary">
                        <Link href="/org/abac">Open editor</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{allowCount} allow</Badge>
                    <Badge variant="destructive">{denyCount} deny</Badge>
                    <Badge variant="outline">{policies.length} total</Badge>
                </div>

                {policies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ABAC policies configured yet.</p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {policies.slice(0, 4).map((policy) => (
                            <div key={policy.id} className="rounded-lg border p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={
                                            policy.effect === 'allow'
                                                ? 'text-xs font-semibold text-emerald-500'
                                                : 'text-xs font-semibold text-red-500'
                                        }
                                    >
                                        {policy.effect.toUpperCase()}
                                    </span>
                                    <span className="text-xs font-semibold text-[oklch(var(--foreground))] break-all">
                                        {policy.id}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {policy.description ?? 'No description'}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Actions: {policy.actions.join(', ')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PanelSkeleton() {
    return <div className="h-44 w-full animate-pulse rounded-2xl bg-[oklch(var(--muted))]" />;
}

