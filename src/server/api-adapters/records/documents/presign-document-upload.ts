import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { documentVaultPresignSchema } from '@/server/types/records/document-vault-schemas';
import { readJson } from '@/server/api-adapters/http/request-utils';
import { getDocumentVaultStorageConfig } from '@/server/config/storage';
import { assertAllowedDocumentVaultContentType, assertAttachmentSizeWithinLimit } from '@/server/lib/uploads/attachment-validation';
import { buildDocumentVaultBlobName, presignAzureBlobUpload } from '@/server/lib/storage/azure-blob-presigner';

export interface PresignDocumentUploadResponse {
    uploadUrl: string;
    storageKey: string;
    headers: Record<string, string>;
    expiresAt: string;
    documentKey: string;
}

export async function presignDocumentUploadController(request: Request): Promise<PresignDocumentUploadResponse> {
    const payload = documentVaultPresignSchema.parse(await readJson(request));

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'api:records:documents:presign',
            action: 'create',
            resourceType: 'records.document',
            resourceAttributes: {
                fileName: payload.fileName,
                contentType: payload.contentType,
                fileSize: payload.fileSize,
            },
        },
    );

    const config = getDocumentVaultStorageConfig();
    assertAllowedDocumentVaultContentType(payload.contentType);
    assertAttachmentSizeWithinLimit(payload.fileSize, config.maxBytes);

    const documentKey = crypto.randomUUID();
    const blobName = buildDocumentVaultBlobName(
        authorization.orgId,
        authorization.dataResidency,
        documentKey,
        payload.fileName,
    );

    const presigned = presignAzureBlobUpload(config, {
        blobName,
        contentType: payload.contentType,
        contentLength: payload.fileSize,
    });

    return {
        ...presigned,
        documentKey,
    };
}
