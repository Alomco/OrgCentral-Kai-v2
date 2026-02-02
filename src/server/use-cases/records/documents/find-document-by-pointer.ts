import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertDataCompliance } from '@/server/security/guards/data-residency-validation-guards';
import { isClassificationAllowed } from './document-vault-helpers';

export interface FindDocumentByPointerInput {
    authorization: RepositoryAuthorizationContext;
    blobPointer: string;
}

export interface FindDocumentByPointerDependencies {
    documentVaultRepository: IDocumentVaultRepository;
}

export async function findDocumentByPointer(
    deps: FindDocumentByPointerDependencies,
    input: FindDocumentByPointerInput,
): Promise<DocumentVaultRecord | null> {
    assertDataCompliance(
        input.authorization,
        input.authorization.dataResidency,
        input.authorization.dataClassification,
        'document-vault:find',
    );

    const record = await deps.documentVaultRepository.findByBlobPointer(input.blobPointer);
    if (!record || record.orgId !== input.authorization.orgId) {
        return null;
    }

    if (!isClassificationAllowed(record.classification, input.authorization.dataClassification)) {
        return null;
    }

    return record;
}
