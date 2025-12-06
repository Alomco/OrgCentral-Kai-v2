import { cacheLife, cacheTag } from 'next/cache';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';

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

type RevalidateTagFunction = (tag: string) => Promise<void>;

const DEFAULT_REVALIDATE: RevalidateTagFunction = async () => { /* noop fallback */ };
let revalidateTagReference: RevalidateTagFunction = DEFAULT_REVALIDATE;
let revalidateTagInitialized = false;

async function getRevalidateTag(): Promise<RevalidateTagFunction> {
    if (!revalidateTagInitialized) {
        try {
            const cacheModule = await import('next/cache');
            type RevalidateTagRaw = (tag: string, option?: unknown) => unknown;
            const revalidate = (cacheModule as { revalidateTag?: RevalidateTagRaw }).revalidateTag;
            if (typeof revalidate === 'function') {
                revalidateTagReference = async (tag: string) => {
                    // Wrap the underlying revalidate call so callers always get a Promise<void>
                    await Promise.resolve(revalidate(tag, 'seconds'));
                };
            } else {
                revalidateTagReference = DEFAULT_REVALIDATE;
            }
        } catch {
            revalidateTagReference = DEFAULT_REVALIDATE;
        }
        revalidateTagInitialized = true;
    }

    return revalidateTagReference;
}

export function buildCacheTag({ orgId, scope, classification, residency }: CacheTagPayload): string {
    return `org:${orgId}:${classification}:${residency}:${scope}`;
}

export function registerCacheTag(payload: CacheTagPayload): void {
    cacheTag(buildCacheTag(payload));

    if (payload.classification !== 'OFFICIAL') {
        cacheLife('seconds');
    }
}

export async function invalidateCache(payload: CacheTagPayload): Promise<void> {
    const revalidate = await getRevalidateTag();
    await revalidate(buildCacheTag(payload));
}

/**
 * Convenience helper to invalidate cache for an org-scoped resource
 * Requires tenant context to be available (e.g., from service context or headers)
 */
export async function invalidateOrgCache(
    orgId: string,
    scope: CacheScope,
    classification: DataClassificationLevel = 'OFFICIAL',
    residency: DataResidencyZone = 'UK_ONLY',
): Promise<void> {
    await invalidateCache({ orgId, scope, classification, residency });
}

/**
 * Convenience helper to register cache tag for an org-scoped resource
 */
export function registerOrgCacheTag(
    orgId: string,
    scope: CacheScope,
    classification: DataClassificationLevel = 'OFFICIAL',
    residency: DataResidencyZone = 'UK_ONLY',
): void {
    registerCacheTag({ orgId, scope, classification, residency });
}
