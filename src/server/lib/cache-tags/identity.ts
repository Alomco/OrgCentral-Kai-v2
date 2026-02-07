import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { buildCacheTag, invalidateCache, registerCacheTag } from '@/server/lib/cache-tags';
import {
    CACHE_SCOPE_ORG_MEMBERSHIPS,
    CACHE_SCOPE_ORG_USERS,
    type CacheScope,
} from '@/server/constants/cache-scopes';

export const IDENTITY_CACHE_SCOPES = {
    memberships: CACHE_SCOPE_ORG_MEMBERSHIPS,
    users: CACHE_SCOPE_ORG_USERS,
} as const;

export type IdentityCacheScopeKey = keyof typeof IDENTITY_CACHE_SCOPES;

export interface IdentityCacheContext {
    orgId: string;
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}

export function resolveIdentityCacheScopes(options?: {
    includeMemberships?: boolean;
    includeUsers?: boolean;
}): CacheScope[] {
    const scopes = new Set<CacheScope>();

    if (options?.includeMemberships ?? true) {
        scopes.add(IDENTITY_CACHE_SCOPES.memberships);
    }

    if (options?.includeUsers ?? true) {
        scopes.add(IDENTITY_CACHE_SCOPES.users);
    }

    return Array.from(scopes);
}

export function buildMembershipsTag(context: IdentityCacheContext): string {
    return buildCacheTag({
        orgId: context.orgId,
        scope: IDENTITY_CACHE_SCOPES.memberships,
        classification: context.classification,
        residency: context.residency,
    });
}

export function buildOrgUsersTag(context: IdentityCacheContext): string {
    return buildCacheTag({
        orgId: context.orgId,
        scope: IDENTITY_CACHE_SCOPES.users,
        classification: context.classification,
        residency: context.residency,
    });
}

export function registerMembershipsTag(context: IdentityCacheContext): void {
    registerCacheTag({
        orgId: context.orgId,
        scope: IDENTITY_CACHE_SCOPES.memberships,
        classification: context.classification,
        residency: context.residency,
    });
}

export function registerOrgUsersTag(context: IdentityCacheContext): void {
    registerCacheTag({
        orgId: context.orgId,
        scope: IDENTITY_CACHE_SCOPES.users,
        classification: context.classification,
        residency: context.residency,
    });
}

export async function invalidateMemberships(context: IdentityCacheContext): Promise<void> {
    await invalidateCache({
        orgId: context.orgId,
        scope: IDENTITY_CACHE_SCOPES.memberships,
        classification: context.classification,
        residency: context.residency,
    });
}

export async function invalidateOrgUsers(context: IdentityCacheContext): Promise<void> {
    await invalidateCache({
        orgId: context.orgId,
        scope: IDENTITY_CACHE_SCOPES.users,
        classification: context.classification,
        residency: context.residency,
    });
}
