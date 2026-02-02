'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import { documentVaultKeys, listDocumentVaultRecords } from '../document-vault.api';
import { DocumentVaultUploadForm } from './document-vault-upload-form';
import { DocumentVaultTable } from './document-vault-table';

interface DocumentVaultPanelProps {
    initialDocuments: DocumentVaultRecord[];
}

export function DocumentVaultPanel({ initialDocuments }: DocumentVaultPanelProps) {
    const queryClient = useQueryClient();
    const { data = initialDocuments, isError, error } = useQuery({
        queryKey: documentVaultKeys.list(),
        queryFn: () => listDocumentVaultRecords(),
        initialData: initialDocuments,
    });

    const handleUploaded = () => {
        void queryClient.invalidateQueries({ queryKey: documentVaultKeys.list() }).catch(() => null);
    };

    return (
        <div className="space-y-6">
            <DocumentVaultUploadForm onUploaded={handleUploaded} />

            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{data.length} documents stored</span>
                    {isError ? (
                        <span>{error instanceof Error ? error.message : 'Unable to refresh documents.'}</span>
                    ) : null}
                </div>
                <DocumentVaultTable documents={data} />
            </div>
        </div>
    );
}
