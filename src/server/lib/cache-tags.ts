import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { getCacheEngine } from '@/server/lib/cache-engine';
import { isSensitivePayload } from '@/server/lib/cache-engine/types';

/**
 * Cache scope for different types of data
 * Common values: 'org-profile', 'leave-entitlements', 'leave-requests', 'members'
 * Can also be any custom string value
 */
export type CacheScope = string;

export interface CacheTagPayload {
    orgId: string;
    scope: CacheScope;
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}

export function buildCacheTag({ orgId, scope, classification, residency }: CacheTagPayload): string {
    return `org:${orgId}:${classification}:${residency}:${scope}`;
}

export function registerCacheTag(payload: CacheTagPayload): void {
    const engine = getCacheEngine();
    engine.registerTag(buildCacheTag(payload), { shortLived: isSensitivePayload(payload) });
}

export async function invalidateCache(payload: CacheTagPayload): Promise<void> {
    const engine = getCacheEngine();
    await engine.invalidateTag(buildCacheTag(payload));
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
