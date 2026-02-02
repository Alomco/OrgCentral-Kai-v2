'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
import { Paperclip, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocumentVaultUpload } from '@/app/(app)/hr/_components/document-vault/use-document-vault-upload';
import { createDocumentVaultRecord } from '@/app/(app)/hr/documents/document-vault.api';
import type { ComplianceAttachmentInput, ComplianceSubDocumentType } from '@/server/types/compliance-types';
import type { SecurityClassification, RetentionPolicy } from '@/server/types/records/document-vault';
import type { DocumentVaultStorePayload } from '@/server/types/records/document-vault-schemas';
import { RETENTION_POLICY_VALUES, SECURITY_CLASSIFICATION_VALUES } from '@/server/types/records/document-vault-schemas';

const MAX_ATTACHMENTS = 10;

const FILE_TYPE_MAP: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    jpg: 'image/jpeg',
    png: 'image/png',
};

interface ComplianceAttachmentsFieldProps {
    value: ComplianceAttachmentInput[];
    onChange: (next: ComplianceAttachmentInput[]) => void;
    ownerUserId: string;
    itemType: ComplianceSubDocumentType | null;
    allowedFileTypes?: ('pdf' | 'docx' | 'jpg' | 'png')[];
    disabled?: boolean;
    onBusyChange?: (busy: boolean) => void;
}

export function ComplianceAttachmentsField({
    value,
    onChange,
    ownerUserId,
    itemType,
    allowedFileTypes,
    disabled,
    onBusyChange,
}: ComplianceAttachmentsFieldProps) {
    const [classification, setClassification] = useState<SecurityClassification>('OFFICIAL');
    const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>('SEVEN_YEARS');
    const [localError, setLocalError] = useState<string | null>(null);
    const { uploading, uploadError, uploadFile, resetUploadError } = useDocumentVaultUpload();
    const fileInputId = useId();
    const isDisabled = (disabled ?? false) || uploading;
    const errorMessage = uploadError ?? localError;

    useEffect(() => {
        onBusyChange?.(uploading);
    }, [onBusyChange, uploading]);

    const allowedContentTypes = useMemo(() => {
        if ((allowedFileTypes?.length ?? 0) === 0) {
            return undefined;
        }
        return (allowedFileTypes ?? [])
            .map((entry) => FILE_TYPE_MAP[entry])
            .filter((value): value is string => Boolean(value));
    }, [allowedFileTypes]);

    const handleRemove = useCallback((documentId: string) => {
        onChange(value.filter((item) => item.documentId !== documentId));
    }, [onChange, value]);

    const handleUpload = useCallback(async (file: File) => {
        if (value.length >= MAX_ATTACHMENTS) {
            setLocalError(`Limit ${String(MAX_ATTACHMENTS)} attachments per submission.`);
            return;
        }
        setLocalError(null);
        resetUploadError();

        const uploadResult = await uploadFile(file, { allowedContentTypes });
        if (!uploadResult) {
            return;
        }

        const payload: DocumentVaultStorePayload = {
            type: 'COMPLIANCE',
            classification,
            retentionPolicy,
            blobPointer: uploadResult.blobPointer,
            checksum: uploadResult.checksum,
            fileName: uploadResult.fileName,
            mimeType: uploadResult.mimeType,
            sizeBytes: uploadResult.sizeBytes,
            ownerUserId,
            metadata: {
                source: 'hr.compliance',
                documentKey: uploadResult.documentKey,
            },
        };

        try {
            const record = await createDocumentVaultRecord(payload);
            const uploadedAt = record.createdAt instanceof Date
                ? record.createdAt.toISOString()
                : new Date(record.createdAt).toISOString();
            const attachment: ComplianceAttachmentInput = {
                documentId: record.id,
                fileName: record.fileName,
                mimeType: record.mimeType ?? undefined,
                sizeBytes: record.sizeBytes ?? undefined,
                classification: record.classification,
                retentionPolicy: record.retentionPolicy,
                version: record.version,
                uploadedAt,
            };
            onChange([...value, attachment]);
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Unable to save document record.');
        }
    }, [
        allowedContentTypes,
        classification,
        ownerUserId,
        retentionPolicy,
        uploadFile,
        value,
        onChange,
        resetUploadError,
    ]);

    const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        handleUpload(file).catch((error: unknown) => {
            setLocalError(error instanceof Error ? error.message : 'Unable to upload attachment.');
        });
        event.target.value = '';
    }, [handleUpload]);

    if (itemType !== 'DOCUMENT') {
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label htmlFor="compliance-classification">Classification</Label>
                    <select
                        id="compliance-classification"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={classification}
                        onChange={(event) => setClassification(event.target.value as SecurityClassification)}
                        disabled={isDisabled}
                    >
                        {SECURITY_CLASSIFICATION_VALUES.map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="compliance-retention">Retention</Label>
                    <select
                        id="compliance-retention"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={retentionPolicy}
                        onChange={(event) => setRetentionPolicy(event.target.value as RetentionPolicy)}
                        disabled={isDisabled}
                    >
                        {RETENTION_POLICY_VALUES.map((value) => (
                            <option key={value} value={value}>{value.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Input
                    id={fileInputId}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isDisabled}
                />
                <Button asChild type="button" variant="outline" disabled={isDisabled} className="gap-2">
                    <label htmlFor={fileInputId}>
                        {uploading ? <UploadCloud className="h-4 w-4 animate-pulse" /> : <Paperclip className="h-4 w-4" />}
                        {uploading ? 'Uploading...' : 'Upload attachment'}
                    </label>
                </Button>
            </div>

            {errorMessage ? (
                <p className="text-xs text-destructive">{errorMessage}</p>
            ) : null}

            {value.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attachments uploaded yet.</p>
            ) : (
                <div className="space-y-2">
                    {value.map((item) => (
                        <div key={item.documentId} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                            <div className="min-w-0">
                                <div className="truncate">{item.fileName}</div>
                                <div className="text-xs text-muted-foreground">
                                    {item.classification} / {item.retentionPolicy} / v{String(item.version)}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => handleRemove(item.documentId)}
                                disabled={isDisabled}
                                aria-label="Remove attachment"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
