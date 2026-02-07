import { cacheLife, unstable_noStore as noStore } from 'next/cache';
import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { headers } from 'next/headers';

import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ORG_PROFILE } from '@/server/repositories/cache-scopes';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { getOrganization } from '@/server/use-cases/org/organization/get-organization';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { OrganizationData } from '@/server/types/leave-types';
import type { OrgContext } from './org-context';

export interface OrgProfile {
    organization: OrganizationData;
}

export async function getOrgProfile(context: OrgContext): Promise<OrgProfile> {
    const headerStore = await headers();
    const orgIdFromHeaders = context.orgId.trim();
    const orgId = orgIdFromHeaders && orgIdFromHeaders !== 'public' ? orgIdFromHeaders : undefined;

    const session = await getSessionContext(
        {},
        {
            headers: headerStore,
            // Allow the Better Auth session to supply the active organization when the header/context is missing.
            orgId,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:org-profile',
        },
    );

    async function getOrgProfileCached(
        authorization: RepositoryAuthorizationContext,
        orgId: string,
    ): Promise<OrgProfile> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);
        registerOrgCacheTag(
            authorization.orgId,
            CACHE_SCOPE_ORG_PROFILE,
            authorization.dataClassification,
            authorization.dataResidency,
        );

        const organizationRepository = new PrismaOrganizationRepository();
        const result = await getOrganization(
            { organizationRepository },
            { authorization, orgId },
        );
        return { organization: result.organization };
    }

    // Compliance rule: sensitive data is never cached.
    if (session.authorization.dataClassification !== 'OFFICIAL') {
        noStore();

        const organizationRepository = new PrismaOrganizationRepository();
        const result = await getOrganization(
            { organizationRepository },
            { authorization: session.authorization, orgId: session.authorization.orgId },
        );
        return { organization: result.organization };
    }

    return getOrgProfileCached(
        toCacheSafeAuthorizationContext(session.authorization),
        session.authorization.orgId,
    );
}
