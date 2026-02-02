import { ValidationError } from '@/server/errors';
import type { AzureBlobPresignConfig } from '@/server/lib/storage/azure-blob-presigner';

export interface LeaveStorageConfig extends AzureBlobPresignConfig {
    maxBytes: number;
}

export interface AbsenceStorageConfig extends AzureBlobPresignConfig {
    maxBytes: number;
}

export interface DocumentVaultStorageConfig extends AzureBlobPresignConfig {
    maxBytes: number;
}

export function getLeaveStorageConfig(): LeaveStorageConfig {
    const accountName = process.env.AZURE_BLOB_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY;
    const container = process.env.AZURE_BLOB_CONTAINER_LEAVE ?? process.env.AZURE_BLOB_CONTAINER;

    if (!accountName || !accountKey || !container) {
        throw new ValidationError('Leave storage is not configured (missing account name, key, or container).');
    }

    const maxBytesEnvironment = process.env.LEAVE_ATTACHMENT_MAX_BYTES;
    const maxBytes = maxBytesEnvironment ? Number(maxBytesEnvironment) : 5 * 1024 * 1024;

    return {
        accountName,
        accountKey,
        container,
        basePath: 'leave',
        maxBytes,
        defaultTtlSeconds: 15 * 60,
    };
}

export function getAbsenceStorageConfig(): AbsenceStorageConfig {
    const accountName = process.env.AZURE_BLOB_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY;
    const container = process.env.AZURE_BLOB_CONTAINER_ABSENCE ?? process.env.AZURE_BLOB_CONTAINER;

    if (!accountName || !accountKey || !container) {
        throw new ValidationError('Absence storage is not configured (missing account name, key, or container).');
    }

    const maxBytesEnvironment = process.env.ABSENCE_ATTACHMENT_MAX_BYTES;
    const maxBytes = maxBytesEnvironment ? Number(maxBytesEnvironment) : 50 * 1024 * 1024;

    return {
        accountName,
        accountKey,
        container,
        basePath: 'absence',
        maxBytes,
        defaultTtlSeconds: 15 * 60,
    };
}

export function getDocumentVaultStorageConfig(): DocumentVaultStorageConfig {
    const accountName = process.env.AZURE_BLOB_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY;
    const container = process.env.AZURE_BLOB_CONTAINER_DOCUMENTS ?? process.env.AZURE_BLOB_CONTAINER;

    if (!accountName || !accountKey || !container) {
        throw new ValidationError('Document vault storage is not configured (missing account name, key, or container).');
    }

    const maxBytesEnvironment = process.env.DOCUMENT_VAULT_MAX_BYTES;
    const maxBytes = maxBytesEnvironment ? Number(maxBytesEnvironment) : 25 * 1024 * 1024;

    return {
        accountName,
        accountKey,
        container,
        basePath: 'documents',
        maxBytes,
        defaultTtlSeconds: 15 * 60,
    };
}
