import { BlobSASPermissions, type BlobSASSignatureValues, StorageSharedKeyCredential, generateBlobSASQueryParameters, SASProtocol } from '@azure/storage-blob';

export interface AzureBlobPresignConfig {
    accountName: string;
    accountKey: string;
    container: string;
    basePath?: string;
    defaultTtlSeconds?: number;
}

export interface AzureBlobPresignRequest {
    blobName: string;
    contentType: string;
    contentLength?: number;
    ttlSeconds?: number;
}

export interface AzureBlobPresignResult {
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
    headers: Record<string, string>;
}

export interface AzureBlobReadPresignResult {
    downloadUrl: string;
    expiresAt: string;
}

const DEFAULT_TTL_SECONDS = 15 * 60;

export function presignAzureBlobUpload(config: AzureBlobPresignConfig, request: AzureBlobPresignRequest): AzureBlobPresignResult {
    const ttl = request.ttlSeconds ?? config.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
    const now = new Date();
    const expiresOn = new Date(now.getTime() + ttl * 1000);

    const credential = new StorageSharedKeyCredential(config.accountName, config.accountKey);

    const signature: BlobSASSignatureValues = {
        blobName: request.blobName,
        containerName: config.container,
        permissions: BlobSASPermissions.parse('cw'),
        protocol: SASProtocol.Https,
        startsOn: now,
        expiresOn,
        contentType: request.contentType,
    };

    const sas = generateBlobSASQueryParameters(signature, credential).toString();
    const baseUrl = `https://${config.accountName}.blob.core.windows.net/${config.container}`;
    const storageKey = `${baseUrl}/${request.blobName}`;

    return {
        uploadUrl: `${storageKey}?${sas}`,
        storageKey,
        expiresAt: expiresOn.toISOString(),
        headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': request.contentType,
            ...(request.contentLength ? { 'Content-Length': String(request.contentLength) } : {}),
        },
    };
}

export function buildLeaveAttachmentBlobName(orgId: string, dataResidency: string, requestId: string, fileName: string): string {
    const sanitized = fileName
        .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 120);

    const safeName = sanitized.length > 0 ? sanitized : 'attachment';
    const residency = dataResidency.toLowerCase();

    return `${orgId}/${residency}/leave/${requestId}/${safeName}`;
}

export function buildAbsenceAttachmentBlobName(orgId: string, dataResidency: string, absenceId: string, fileName: string): string {
    const sanitized = fileName
        .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 120);

    const safeName = sanitized.length > 0 ? sanitized : 'attachment';
    const residency = dataResidency.toLowerCase();

    return `${orgId}/${residency}/absence/${absenceId}/${safeName}`;
}

export function buildDocumentVaultBlobName(
    orgId: string,
    dataResidency: string,
    documentKey: string,
    fileName: string,
): string {
    const sanitized = fileName
        .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 120);

    const safeName = sanitized.length > 0 ? sanitized : 'document';
    const residency = dataResidency.toLowerCase();

    return `${orgId}/${residency}/documents/${documentKey}/${safeName}`;
}

export function presignAzureBlobRead(config: AzureBlobPresignConfig, request: { blobUrl: string; contentType?: string; ttlSeconds?: number }): AzureBlobReadPresignResult {
    const ttl = request.ttlSeconds ?? config.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
    const now = new Date();
    const expiresOn = new Date(now.getTime() + ttl * 1000);

    const credential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
    const blobUrl = request.blobUrl.startsWith('http')
        ? request.blobUrl
        : `https://${config.accountName}.blob.core.windows.net/${config.container}/${request.blobUrl}`;
    const url = new URL(blobUrl);
    const signature: BlobSASSignatureValues = {
        blobName: url.pathname.replace(/^\//, ''),
        containerName: config.container,
        permissions: BlobSASPermissions.parse('r'),
        protocol: SASProtocol.Https,
        startsOn: now,
        expiresOn,
        contentType: request.contentType,
    };

    const sas = generateBlobSASQueryParameters(signature, credential).toString();

    return {
        downloadUrl: `${blobUrl}?${sas}`,
        expiresAt: expiresOn.toISOString(),
    };
}
