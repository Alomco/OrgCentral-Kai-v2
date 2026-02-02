'use client';

import { useCallback, useState } from 'react';
import { z } from 'zod';

const presignResponseSchema = z.object({
    uploadUrl: z.url(),
    storageKey: z.string().min(1),
    headers: z.record(z.string(), z.string()),
    expiresAt: z.string().min(1),
    documentKey: z.string().min(1),
});

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

export interface DocumentVaultUploadResult {
    blobPointer: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string;
    documentKey: string;
}

export interface UseDocumentVaultUploadOptions {
    maxBytes?: number;
    allowedContentTypes?: string[];
}

export interface UseDocumentVaultUploadReturn {
    uploading: boolean;
    uploadError: string | null;
    uploadFile: (file: File, options?: UseDocumentVaultUploadOptions) => Promise<DocumentVaultUploadResult | null>;
    resetUploadError: () => void;
}

const DEFAULT_ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function isAllowedType(contentType: string, allowed?: string[]): boolean {
    const normalized = contentType.trim().toLowerCase();
    if (normalized.startsWith('image/')) {
        return true;
    }
    if (allowed && allowed.length > 0) {
        return allowed.map((item) => item.toLowerCase()).includes(normalized);
    }
    return DEFAULT_ALLOWED_TYPES.has(normalized);
}

async function computeChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
}

export function useDocumentVaultUpload(): UseDocumentVaultUploadReturn {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const resetUploadError = useCallback(() => {
        setUploadError(null);
    }, []);

    const uploadFile = useCallback(async (file: File, options?: UseDocumentVaultUploadOptions) => {
        const contentType = file.type || 'application/octet-stream';
        const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
        if (!isAllowedType(contentType, options?.allowedContentTypes)) {
            setUploadError('Documents must be PDF, DOC/DOCX, or image files.');
            return null;
        }

        if (file.size > maxBytes) {
            const maxMb = Math.floor(maxBytes / 1024 / 1024);
            setUploadError(`Document must be under ${String(maxMb)} MB.`);
            return null;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const checksum = await computeChecksum(file);
            const presignResponse = await fetch('/api/hr/documents/presign', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType,
                    fileSize: file.size,
                }),
            });

            if (!presignResponse.ok) {
                const errorText = await presignResponse.text();
                throw new Error(errorText || 'Unable to prepare upload.');
            }

            const presignPayload = presignResponseSchema.parse(await presignResponse.json());
            const putResponse = await fetch(presignPayload.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: presignPayload.headers,
            });

            if (!putResponse.ok) {
                const errorText = await putResponse.text();
                throw new Error(errorText || 'Upload failed.');
            }

            return {
                blobPointer: presignPayload.storageKey,
                fileName: file.name,
                mimeType: contentType,
                sizeBytes: file.size,
                checksum,
                documentKey: presignPayload.documentKey,
            };
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Unable to upload document.');
            return null;
        } finally {
            setUploading(false);
        }
    }, []);

    return {
        uploading,
        uploadError,
        uploadFile,
        resetUploadError,
    };
}
