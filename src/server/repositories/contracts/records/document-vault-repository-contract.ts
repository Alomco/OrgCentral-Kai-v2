import type { DocumentVaultRecord, DocumentVaultFilters, DocumentVaultCreationData, DocumentVaultUpdateData } from '@/server/types/records/document-vault';

export interface IDocumentVaultRepository {
    findById(id: string): Promise<DocumentVaultRecord | null>;
    findByBlobPointer(blobPointer: string): Promise<DocumentVaultRecord | null>;
    findAll(filters?: DocumentVaultFilters): Promise<DocumentVaultRecord[]>;
    create(data: DocumentVaultCreationData): Promise<DocumentVaultRecord>;
    update(id: string, data: DocumentVaultUpdateData): Promise<DocumentVaultRecord>;
    delete(id: string): Promise<DocumentVaultRecord>;
    /**
     * Contract-facing method for retrieving a document by ID for a tenant/user with ABAC checks.
     */
    getDocument?(tenantId: string, userId: string, id: string): Promise<DocumentVaultRecord | null>;
}
