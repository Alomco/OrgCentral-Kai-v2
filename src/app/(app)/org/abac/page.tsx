import { Suspense } from 'react';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';

import { AbacPolicyEditor } from './_components/abac-policy-editor';
import { buildActionOptions, buildResourceOptions } from './_components/abac-policy-options';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ABAC_POLICIES } from '@/server/repositories/cache-scopes';
import { PrismaAbacPolicyRepository } from '@/server/repositories/prisma/org/abac/prisma-abac-policy-repository';
import { getAbacPolicies } from '@/server/use-cases/org/abac/get-abac-policies';
import { DEFAULT_BOOTSTRAP_POLICIES } from '@/server/security/abac-constants';
import type { AbacPolicy } from '@/server/security/abac-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export default async function OrgAbacPoliciesPage() {
    const headerStore = await headers();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-abac:read',
            action: 'org.abac.read',
            resourceType: 'org.abac.policy',
        },
    );

    const actionOptions = buildActionOptions();
    const resourceOptions = buildResourceOptions();
    const policiesPromise = getPoliciesForUi(authorization);

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Access</p>
                <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">ABAC policies</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Manage attribute-based access policies for this organization.
                </p>
            </div>

            <Suspense fallback={<PolicyEditorSkeleton />}>
                <AbacPolicyEditorPanel
                    policiesPromise={policiesPromise}
                    actionOptions={actionOptions}
                    resourceOptions={resourceOptions}
                />
            </Suspense>

            <Suspense fallback={<PolicySummarySkeleton />}>
                <PolicySummaryPanel policiesPromise={policiesPromise} />
            </Suspense>
        </div>
    );
}

async function getPoliciesForUi(
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

        return loadPolicies(input);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadPolicies(authorization);
    }

    return loadCached(authorization);
}

async function loadPolicies(
    authorization: RepositoryAuthorizationContext,
): Promise<AbacPolicy[]> {
    const { policies } = await getAbacPolicies(
        { policyRepository: new PrismaAbacPolicyRepository() },
        { authorization },
    );
    return policies;
}

async function AbacPolicyEditorPanel({
    policiesPromise,
    actionOptions,
    resourceOptions,
}: {
    policiesPromise: Promise<AbacPolicy[]>;
    actionOptions: string[];
    resourceOptions: string[];
}) {
    const policies = await policiesPromise;

    return (
        <AbacPolicyEditor
            initialPolicies={policies}
            defaultPolicies={DEFAULT_BOOTSTRAP_POLICIES}
            actionOptions={actionOptions}
            resourceOptions={resourceOptions}
        />
    );
}

async function PolicySummaryPanel({
    policiesPromise,
}: {
    policiesPromise: Promise<AbacPolicy[]>;
}) {
    const policies = await policiesPromise;
    return <PolicySummary policies={policies} />;
}

function PolicySummary({ policies }: { policies: AbacPolicy[] }) {
    const allowCount = policies.filter((policy) => policy.effect === 'allow').length;
    const denyCount = policies.filter((policy) => policy.effect === 'deny').length;

    return (
        <div className="space-y-4 rounded-2xl bg-[hsl(var(--card)/0.6)] p-6 backdrop-blur">
            <div>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Current policies</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Ordered by priority (highest first). {policies.length} total ({allowCount} allow, {denyCount} deny).
                </p>
            </div>

            {policies.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    No ABAC policies configured yet.
                </p>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {policies.map((policy) => (
                        <div key={policy.id} className="rounded-xl bg-[hsl(var(--muted)/0.35)] p-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={
                                        policy.effect === 'allow'
                                            ? 'text-xs font-semibold text-emerald-400'
                                            : 'text-xs font-semibold text-red-400'
                                    }
                                >
                                    {policy.effect.toUpperCase()}
                                </span>
                                <span className="text-xs font-semibold text-[hsl(var(--foreground))] break-all">
                                    {policy.id}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                {policy.description ?? 'No description'}
                            </p>
                            <div className="mt-2 grid gap-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                                <span>Priority: {policy.priority ?? 'default'}</span>
                                <span>Actions: {policy.actions.join(', ')}</span>
                                <span>Resources: {policy.resources.join(', ')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PolicyEditorSkeleton() {
    return <div className="h-80 w-full animate-pulse rounded-2xl bg-[hsl(var(--muted))] motion-reduce:animate-none" />;
}

function PolicySummarySkeleton() {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-[hsl(var(--muted))] motion-reduce:animate-none" />;
}
