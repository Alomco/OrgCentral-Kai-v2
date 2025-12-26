import { Suspense } from 'react';
import { cacheLife, unstable_noStore as noStore } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { InvitePolicyForm, initialInvitePolicyState, type InvitePolicyState } from './_components/invite-policy-form';
import { resolveOrgContext } from '@/server/org/org-context';
import { invalidateOrgCache, registerOrgCacheTag } from '@/server/lib/cache-tags';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { prisma } from '@/server/lib/prisma';

const invitePolicySchema = z.object({
    open: z.boolean().default(false),
});

const organizationSettingsSchema = z.looseObject({
    invites: invitePolicySchema.optional(),
});

const INVITE_POLICY_CACHE_SCOPE = 'org:invite-policy';

export default async function OrgSettingsPage() {
    const orgContext = await resolveOrgContext();
    const headerStore = await headers();

    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            orgId: orgContext.orgId,
            requiredPermissions: { organization: ['manage'] },
            auditSource: 'ui:org-settings:read',
        },
    );

    return (
        <div className="space-y-6 p-6">
            <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Settings</p>
                <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Access & invites</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Control how people can join your organization ({authorization.orgId}).
                </p>
            </div>
            <Suspense fallback={<InvitePolicySkeleton />}>
                <InvitePolicyPanel authorization={authorization} />
            </Suspense>
        </div>
    );
}

async function InvitePolicyPanel({
    authorization,
}: {
    authorization: RepositoryAuthorizationContext;
}) {
    const initialOpen = await getInvitePolicyForUi(authorization);
    return <InvitePolicyForm action={updateInvitePolicy} defaultOpen={initialOpen} />;
}

function InvitePolicySkeleton() {
    return <div className="h-28 w-full animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />;
}

async function getInvitePolicyForUi(authorization: RepositoryAuthorizationContext): Promise<boolean> {
    async function loadCached(input: RepositoryAuthorizationContext): Promise<boolean> {
        'use cache';
        cacheLife('minutes');

        registerOrgCacheTag(
            input.orgId,
            INVITE_POLICY_CACHE_SCOPE,
            input.dataClassification,
            input.dataResidency,
        );

        return loadInvitePolicy(input.orgId);
    }

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        return loadInvitePolicy(authorization.orgId);
    }

    return loadCached(authorization);
}

async function loadInvitePolicy(orgId: string): Promise<boolean> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { settings: true },
    });

    const parsedSettings = organizationSettingsSchema.safeParse(org?.settings ?? {});
    return parsedSettings.success ? (parsedSettings.data.invites?.open ?? false) : false;
}

export async function updateInvitePolicy(
    _previous: InvitePolicyState = initialInvitePolicyState,
    formData: FormData,
): Promise<InvitePolicyState> {
    'use server';

    const orgContext = await resolveOrgContext();
    const headerStore = await headers();

    const parsed = invitePolicySchema.safeParse({
        open: formData.get('invite-open') === 'on',
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid form data', open: _previous.open };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            orgId: orgContext.orgId,
            requiredPermissions: { organization: ['manage'] },
            auditSource: 'ui:org-settings:invite-policy',
        },
    );

    const org = await prisma.organization.findUnique({
        where: { id: authorization.orgId },
        select: { settings: true },
    });

    const settingsObject = coerceJsonObject(org?.settings ?? {});
    const nextSettings: Prisma.InputJsonObject = {
        ...settingsObject,
        invites: { open: parsed.data.open },
    };

    await prisma.organization.update({
        where: { id: authorization.orgId },
        data: { settings: nextSettings },
    });

    await invalidateOrgCache(
        authorization.orgId,
        INVITE_POLICY_CACHE_SCOPE,
        authorization.dataClassification,
        authorization.dataResidency,
    );

    return {
        status: 'success',
        message: parsed.data.open ? 'Invites are now open' : 'Invites are restricted',
        open: parsed.data.open,
    };
}

function coerceJsonObject(value: Prisma.JsonValue): Prisma.JsonObject {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    return {};
}
