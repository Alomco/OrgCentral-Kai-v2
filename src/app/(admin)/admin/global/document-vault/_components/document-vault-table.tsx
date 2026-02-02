import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import { formatHumanDate } from '@/app/(app)/hr/_components/format-date';
import { DocumentVaultDownloadButton } from './document-vault-download-button';

interface DocumentVaultTableProps {
    documents: DocumentVaultRecord[];
    tenantId?: string;
    breakGlassApprovalId?: string;
}

function formatBytes(value?: number | null): string {
    if (!value || !Number.isFinite(value)) {
        return '-';
    }
    if (value < 1024) {
        return `${String(value)} B`;
    }
    const kb = value / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

function formatDate(value: Date | string | null | undefined): string {
    if (!value) {
        return '-';
    }
    const resolved = value instanceof Date ? value : new Date(value);
    return Number.isNaN(resolved.getTime()) ? '-' : formatHumanDate(resolved);
}

export function DocumentVaultTable({ documents, tenantId, breakGlassApprovalId }: DocumentVaultTableProps) {
    if (documents.length === 0) {
        return <p className="text-sm text-muted-foreground">No documents match this filter.</p>;
    }

    const canDownload = Boolean(tenantId && breakGlassApprovalId);

    return (
        <div className="overflow-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Classification</TableHead>
                        <TableHead>Retention</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Download</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((document_) => (
                        <TableRow key={document_.id}>
                            <TableCell className="font-medium">{document_.fileName}</TableCell>
                            <TableCell>{document_.type}</TableCell>
                            <TableCell>{document_.classification}</TableCell>
                            <TableCell>{document_.retentionPolicy}</TableCell>
                            <TableCell>v{String(document_.version)}</TableCell>
                            <TableCell>{formatBytes(document_.sizeBytes)}</TableCell>
                            <TableCell>{document_.ownerUserId ?? '-'}</TableCell>
                            <TableCell>{formatDate(document_.createdAt)}</TableCell>
                            <TableCell>
                                {canDownload && tenantId && breakGlassApprovalId ? (
                                    <DocumentVaultDownloadButton
                                        documentId={document_.id}
                                        tenantId={tenantId}
                                        breakGlassApprovalId={breakGlassApprovalId}
                                    />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Approval required</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
