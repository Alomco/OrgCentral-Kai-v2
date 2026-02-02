import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { DocumentVaultListQuery, DocumentVaultStorePayload } from '@/server/types/records/document-vault-schemas';

export const documentVaultKeys = {
    list: (filters?: DocumentVaultListQuery) => ['document-vault', 'list', filters ?? {}] as const,
};

export async function listDocumentVaultRecords(
    filters?: DocumentVaultListQuery,
): Promise<DocumentVaultRecord[]> {
    const params = new URLSearchParams();
    if (filters?.ownerUserId) { params.set('ownerUserId', filters.ownerUserId); }
    if (filters?.type) { params.set('type', filters.type); }
    if (filters?.classification) { params.set('classification', filters.classification); }
    if (filters?.retentionPolicy) { params.set('retentionPolicy', filters.retentionPolicy); }
    if (filters?.fileName) { params.set('fileName', filters.fileName); }

    const query = params.toString();
    const response = await fetch(`/api/hr/documents${query ? `?${query}` : ''}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to fetch documents.');
    }
    const payload = (await response.json()) as { documents: DocumentVaultRecord[] };
    return payload.documents;
}

export async function createDocumentVaultRecord(
    payload: DocumentVaultStorePayload,
): Promise<DocumentVaultRecord> {
    const response = await fetch('/api/hr/documents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to store document.');
    }

    const result = (await response.json()) as { document: DocumentVaultRecord };
    return result.document;
}
