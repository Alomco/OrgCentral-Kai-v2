import type { DocumentVaultRecord, DocumentVaultFilters } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertDataCompliance } from '@/server/security/guards/data-residency-validation-guards';
import { isClassificationAllowed } from './document-vault-helpers';
import { registerDocumentVaultCache } from './shared/cache-helpers';

export interface ListDocumentsInput {
    authorization: RepositoryAuthorizationContext;
    filters?: DocumentVaultFilters;
}

export interface ListDocumentsDependencies {
    documentVaultRepository: IDocumentVaultRepository;
}

export interface ListDocumentsResult {
    documents: DocumentVaultRecord[];
}

export async function listDocuments(
    deps: ListDocumentsDependencies,
    input: ListDocumentsInput,
): Promise<ListDocumentsResult> {
    registerDocumentVaultCache(input.authorization);
    assertDataCompliance(
        input.authorization,
        input.authorization.dataResidency,
        input.authorization.dataClassification,
        'document-vault:list',
    );

    const documents = await deps.documentVaultRepository.findAll({
        ...(input.filters ?? {}),
        orgId: input.authorization.orgId,
    });

    const filtered = documents.filter((document_) =>
        isClassificationAllowed(document_.classification, input.authorization.dataClassification),
    );

    return { documents: filtered };
}
