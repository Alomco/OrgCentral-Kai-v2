import { z } from 'zod';
import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import { presignTenantDocumentDownloadService } from '@/server/services/platform/admin/document-vault-service';
import {
    parseAdminDocumentVaultDownloadQuery,
} from '@/server/validators/platform/admin/document-vault-validators';

export interface PresignAdminDocumentDownloadResponse {
    success: true;
    downloadUrl: string;
    expiresAt: string;
    fileName: string;
}

function parseQuery(request: Request) {
    const params = new URL(request.url).searchParams;
    return parseAdminDocumentVaultDownloadQuery({
        tenantId: params.get('tenantId') ?? undefined,
        breakGlassApprovalId: params.get('breakGlassApprovalId') ?? undefined,
    });
}

export async function presignAdminDocumentDownloadController(
    request: Request,
    documentId: string,
): Promise<PresignAdminDocumentDownloadResponse> {
    const query = parseQuery(request);
    const parsedDocumentId = z.uuid().parse(documentId);

    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformDocuments: ['download'] },
        auditSource: 'api:platform:document-vault:download',
        action: 'read',
        resourceType: 'records.document',
    });

    const result = await presignTenantDocumentDownloadService(authorization, {
        tenantId: query.tenantId,
        documentId: parsedDocumentId,
        breakGlassApprovalId: query.breakGlassApprovalId,
    });

    return {
        success: true,
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        fileName: result.fileName,
    };
}
