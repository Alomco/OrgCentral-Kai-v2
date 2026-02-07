import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { getCacheEngine } from '@/server/lib/cache-engine';
import { isSensitivePayload } from '@/server/lib/cache-engine/types';
import type { CacheScope } from '@/server/constants/cache-scopes';
export type { CacheScope } from '@/server/constants/cache-scopes';

export interface OrgCacheContext {
    orgId: string;
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}

export interface OrgScopedCachePayload extends OrgCacheContext {
    scope: CacheScope;
}

export type CacheTagPayload = OrgScopedCachePayload;

export function buildCacheTag({ orgId, scope, classification, residency }: CacheTagPayload): string {
    return `org:${orgId}:${classification}:${residency}:${scope}`;
}

export function buildOrgScopedCacheTag(payload: OrgScopedCachePayload): string {
    return buildCacheTag(payload);
}

export function registerCacheTag(payload: CacheTagPayload): void {
    const engine = getCacheEngine();
    engine.registerTag(buildCacheTag(payload), { shortLived: isSensitivePayload(payload) });
}

export async function invalidateCache(payload: CacheTagPayload): Promise<void> {
    const engine = getCacheEngine();
    await engine.invalidateTag(buildCacheTag(payload));
}

export async function invalidateOrgScopedCache(payload: OrgScopedCachePayload): Promise<void> {
    await invalidateCache(payload);
}

/**
 * Convenience helper to invalidate cache for an org-scoped resource
 * Requires tenant context to be available (e.g., from service context or headers)
 */
export async function invalidateOrgCache(
    orgId: string,
    scope: CacheScope,
    classification: DataClassificationLevel,
    residency: DataResidencyZone,
): Promise<void> {
    await invalidateCache({ orgId, scope, classification, residency });
}

/**
 * Convenience helper to register cache tag for an org-scoped resource
 */
export function registerOrgCacheTag(
    orgId: string,
    scope: CacheScope,
    classification: DataClassificationLevel,
    residency: DataResidencyZone,
): void {
    registerCacheTag({ orgId, scope, classification, residency });
}

export function registerOrgScopedCacheTag(payload: OrgScopedCachePayload): void {
    registerCacheTag(payload);
}
