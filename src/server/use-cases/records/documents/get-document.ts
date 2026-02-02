import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertDataCompliance } from '@/server/security/guards/data-residency-validation-guards';
import { isClassificationAllowed } from './document-vault-helpers';

export interface GetDocumentInput {
    authorization: RepositoryAuthorizationContext;
    documentId: string;
}

export interface GetDocumentDependencies {
    documentVaultRepository: IDocumentVaultRepository;
}

export async function getDocument(
    deps: GetDocumentDependencies,
    input: GetDocumentInput,
): Promise<DocumentVaultRecord | null> {
    assertDataCompliance(
        input.authorization,
        input.authorization.dataResidency,
        input.authorization.dataClassification,
        'document-vault:get',
    );

    const record = await deps.documentVaultRepository.findById(input.documentId);
    if (!record || record.orgId !== input.authorization.orgId) {
        return null;
    }

    if (!isClassificationAllowed(record.classification, input.authorization.dataClassification)) {
        return null;
    }

    return record;
}
