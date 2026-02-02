import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { buildCacheTag, invalidateCache, registerCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_DOCUMENT_VAULT } from '@/server/constants/cache-scopes';

export interface DocumentVaultCacheContext {
    orgId: string;
    classification: DataClassificationLevel;
    residency: DataResidencyZone;
}

export function buildDocumentVaultTag(context: DocumentVaultCacheContext): string {
    return buildCacheTag({
        orgId: context.orgId,
        scope: CACHE_SCOPE_DOCUMENT_VAULT,
        classification: context.classification,
        residency: context.residency,
    });
}

export function registerDocumentVaultTag(context: DocumentVaultCacheContext): void {
    registerCacheTag({
        orgId: context.orgId,
        scope: CACHE_SCOPE_DOCUMENT_VAULT,
        classification: context.classification,
        residency: context.residency,
    });
}

export async function invalidateDocumentVault(
    context: DocumentVaultCacheContext,
): Promise<void> {
    await invalidateCache({
        orgId: context.orgId,
        scope: CACHE_SCOPE_DOCUMENT_VAULT,
        classification: context.classification,
        residency: context.residency,
    });
}
