import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { invalidateDocumentVault, registerDocumentVaultTag } from '@/server/lib/cache-tags/document-vault';

function toCacheContext(authorization: RepositoryAuthorizationContext) {
    return {
        orgId: authorization.orgId,
        classification: authorization.dataClassification,
        residency: authorization.dataResidency,
    };
}

export function registerDocumentVaultCache(authorization: RepositoryAuthorizationContext): void {
    registerDocumentVaultTag(toCacheContext(authorization));
}

export async function invalidateDocumentVaultCache(
    authorization: RepositoryAuthorizationContext,
): Promise<void> {
    await invalidateDocumentVault(toCacheContext(authorization));
}
