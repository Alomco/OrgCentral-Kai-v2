'use server';

import { cacheLife, unstable_noStore as noStore } from 'next/cache';
import { randomUUID } from 'node:crypto';

import { CACHE_LIFE_LONG } from '@/server/repositories/cache-profiles';
import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_BRANDING } from '@/server/repositories/cache-scopes';
import { getOrgBrandingWithPrisma } from '@/server/use-cases/org/branding/branding-composition';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { OrgBranding } from '@/server/types/branding-types';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

interface GetOrgBrandingInput {
    orgId: string;
    residency: DataResidencyZone;
    classification: DataClassificationLevel;
}

export async function getOrgBranding(input: GetOrgBrandingInput): Promise<OrgBranding | null> {
    if (input.classification !== 'OFFICIAL') {
        noStore();
        return getOrgBrandingWithPrisma({
            authorization: buildSystemContext(input),
            orgId: input.orgId,
        }).then((res) => res.branding);
    }

    return getOrgBrandingCached(input);
}

async function getOrgBrandingCached(input: GetOrgBrandingInput): Promise<OrgBranding | null> {
    'use cache';
    cacheLife(CACHE_LIFE_LONG);

    registerOrgCacheTag(input.orgId, CACHE_SCOPE_BRANDING, input.classification, input.residency);

    const result = await getOrgBrandingWithPrisma({
        authorization: buildSystemContext(input),
        orgId: input.orgId,
    });

    return result.branding;
}

function buildSystemContext(input: GetOrgBrandingInput): RepositoryAuthorizationContext {
    const auditSource = 'server:branding:get-org-branding';
    return {
        orgId: input.orgId,
        userId: 'system',
        roleKey: 'custom',
        permissions: {},
        dataResidency: input.residency,
        dataClassification: input.classification,
        auditSource,
        auditBatchId: undefined,
        correlationId: randomUUID(),
        tenantScope: {
            orgId: input.orgId,
            dataResidency: input.residency,
            dataClassification: input.classification,
            auditSource,
            auditBatchId: undefined,
        },
    };
}
