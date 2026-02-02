import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { DocumentVaultRecord, DocumentVaultFilters, DocumentVaultCreationData } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import { getDocumentVaultRepository } from '@/server/repositories/providers/records/document-vault-repository-provider';
import { listDocuments } from '@/server/use-cases/records/documents/list-documents';
import { getDocument } from '@/server/use-cases/records/documents/get-document';
import { findDocumentByPointer } from '@/server/use-cases/records/documents/find-document-by-pointer';
import { storeDocument } from '@/server/use-cases/records/documents/store-document';

export interface DocumentVaultServiceDependencies {
    documentVaultRepository: IDocumentVaultRepository;
}

export interface DocumentVaultServiceContract {
    listDocuments(
        authorization: RepositoryAuthorizationContext,
        filters?: DocumentVaultFilters,
    ): Promise<DocumentVaultRecord[]>;
    getDocument(
        authorization: RepositoryAuthorizationContext,
        documentId: string,
    ): Promise<DocumentVaultRecord | null>;
    findDocumentByPointer(
        authorization: RepositoryAuthorizationContext,
        blobPointer: string,
    ): Promise<DocumentVaultRecord | null>;
    storeDocument(
        authorization: RepositoryAuthorizationContext,
        payload: DocumentVaultCreationData,
    ): Promise<DocumentVaultRecord>;
}

export class DocumentVaultService extends AbstractBaseService implements DocumentVaultServiceContract {
    constructor(private readonly deps: DocumentVaultServiceDependencies) {
        super();
    }

    async listDocuments(
        authorization: RepositoryAuthorizationContext,
        filters?: DocumentVaultFilters,
    ): Promise<DocumentVaultRecord[]> {
        return this.runOperation(
            'records.document-vault.list',
            authorization,
            undefined,
            async () => {
                const result = await listDocuments(this.deps, { authorization, filters });
                return result.documents;
            },
        );
    }

    async getDocument(
        authorization: RepositoryAuthorizationContext,
        documentId: string,
    ): Promise<DocumentVaultRecord | null> {
        return this.runOperation(
            'records.document-vault.get',
            authorization,
            undefined,
            () => getDocument(this.deps, { authorization, documentId }),
        );
    }

    async findDocumentByPointer(
        authorization: RepositoryAuthorizationContext,
        blobPointer: string,
    ): Promise<DocumentVaultRecord | null> {
        return this.runOperation(
            'records.document-vault.find',
            authorization,
            undefined,
            () => findDocumentByPointer(this.deps, { authorization, blobPointer }),
        );
    }

    async storeDocument(
        authorization: RepositoryAuthorizationContext,
        payload: DocumentVaultCreationData,
    ): Promise<DocumentVaultRecord> {
        return this.runOperation(
            'records.document-vault.store',
            authorization,
            undefined,
            () => storeDocument(this.deps, { authorization, payload }),
        );
    }

    private runOperation<TResult>(
        operation: string,
        authorization: RepositoryAuthorizationContext,
        metadata: Record<string, unknown> | undefined,
        handler: () => Promise<TResult>,
    ): Promise<TResult> {
        const context = this.buildContext(authorization, { metadata });
        return this.executeInServiceContext(context, operation, handler);
    }

    private buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId ?? authorization.correlationId,
            metadata: options?.metadata,
        };
    }
}

const sharedDependencies: DocumentVaultServiceDependencies = {
    documentVaultRepository: getDocumentVaultRepository(),
};
const sharedService = new DocumentVaultService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<DocumentVaultServiceDependencies>,
): DocumentVaultServiceDependencies {
    if (!overrides) {
        return sharedDependencies;
    }
    return { ...sharedDependencies, ...overrides };
}

export function getDocumentVaultService(
    overrides?: Partial<DocumentVaultServiceDependencies>,
): DocumentVaultService {
    if (!overrides) {
        return sharedService;
    }
    return new DocumentVaultService(resolveDependencies(overrides));
}

export async function listDocumentsService(
    authorization: RepositoryAuthorizationContext,
    filters?: DocumentVaultFilters,
    overrides?: Partial<DocumentVaultServiceDependencies>,
): Promise<DocumentVaultRecord[]> {
    return getDocumentVaultService(overrides).listDocuments(authorization, filters);
}

export async function getDocumentService(
    authorization: RepositoryAuthorizationContext,
    documentId: string,
    overrides?: Partial<DocumentVaultServiceDependencies>,
): Promise<DocumentVaultRecord | null> {
    return getDocumentVaultService(overrides).getDocument(authorization, documentId);
}

export async function findDocumentByPointerService(
    authorization: RepositoryAuthorizationContext,
    blobPointer: string,
    overrides?: Partial<DocumentVaultServiceDependencies>,
): Promise<DocumentVaultRecord | null> {
    return getDocumentVaultService(overrides).findDocumentByPointer(authorization, blobPointer);
}

export async function storeDocumentService(
    authorization: RepositoryAuthorizationContext,
    payload: DocumentVaultCreationData,
    overrides?: Partial<DocumentVaultServiceDependencies>,
): Promise<DocumentVaultRecord> {
    return getDocumentVaultService(overrides).storeDocument(authorization, payload);
}
