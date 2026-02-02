import { cacheLife, unstable_noStore as noStore } from 'next/cache';

import { CACHE_LIFE_SHORT } from '@/server/repositories/cache-profiles';
import { toCacheSafeAuthorizationContext } from '@/server/repositories/security/cache-authorization';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getDocumentVaultRepository } from '@/server/repositories/providers/records/document-vault-repository-provider';
import type { DocumentVaultFilters, DocumentVaultRecord } from '@/server/types/records/document-vault';
import { listDocuments } from './list-documents';

export interface ListDocumentsForUiInput {
    authorization: RepositoryAuthorizationContext;
    filters?: DocumentVaultFilters;
}

export interface ListDocumentsForUiResult {
    documents: DocumentVaultRecord[];
}

function resolveDependencies() {
    return { documentVaultRepository: getDocumentVaultRepository() };
}

export async function listDocumentsForUi(
    input: ListDocumentsForUiInput,
): Promise<ListDocumentsForUiResult> {
    async function listDocumentsCached(
        cachedInput: ListDocumentsForUiInput,
    ): Promise<ListDocumentsForUiResult> {
        'use cache';
        cacheLife(CACHE_LIFE_SHORT);

        const result = await listDocuments(resolveDependencies(), cachedInput);
        return { documents: result.documents };
    }

    if (input.authorization.dataClassification !== 'OFFICIAL') {
        noStore();
        const result = await listDocuments(resolveDependencies(), input);
        return { documents: result.documents };
    }

    return listDocumentsCached({
        ...input,
        authorization: toCacheSafeAuthorizationContext(input.authorization),
    });
}
