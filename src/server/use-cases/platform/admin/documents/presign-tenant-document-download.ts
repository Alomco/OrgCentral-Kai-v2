import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { getDocumentVaultStorageConfig } from '@/server/config/storage';
import { presignAzureBlobRead } from '@/server/lib/storage/azure-blob-presigner';
import { ValidationError } from '@/server/errors';
import { requireBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/require-break-glass';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { getDocument } from '@/server/use-cases/records/documents/get-document';
import { buildTenantScopedAuthorization } from './document-vault-admin-helpers';

export interface PresignTenantDocumentDownloadInput {
    authorization: RepositoryAuthorizationContext;
    tenantId: string;
    documentId: string;
    breakGlassApprovalId: string;
}

export interface PresignTenantDocumentDownloadDependencies {
    documentVaultRepository: IDocumentVaultRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface PresignTenantDocumentDownloadResult {
    downloadUrl: string;
    expiresAt: string;
    fileName: string;
    document: DocumentVaultRecord;
    scopedAuthorization: RepositoryAuthorizationContext;
}

const DOCUMENT_VAULT_DOWNLOAD_ACTION = 'document-vault.download';

export async function presignTenantDocumentDownload(
    deps: PresignTenantDocumentDownloadDependencies,
    input: PresignTenantDocumentDownloadInput,
): Promise<PresignTenantDocumentDownloadResult> {
    const tenant = await requireTenantInScope(
        deps.tenantRepository,
        input.authorization,
        input.tenantId,
        'Target tenant not found or not within allowed scope for document vault access.',
    );

    const scopedAuthorization = buildTenantScopedAuthorization(
        input.authorization,
        tenant,
        input.authorization.auditSource,
    );

    await requireBreakGlassApproval(deps.breakGlassRepository, {
        authorization: input.authorization,
        approvalId: input.breakGlassApprovalId,
        scope: 'document-vault',
        targetOrgId: tenant.id,
        action: DOCUMENT_VAULT_DOWNLOAD_ACTION,
        resourceId: input.documentId,
    });

    const document = await getDocument(
        { documentVaultRepository: deps.documentVaultRepository },
        { authorization: scopedAuthorization, documentId: input.documentId },
    );

    if (!document) {
        throw new ValidationError('Document not found.');
    }

    let downloadUrl = document.blobPointer;
    let expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    if (document.blobPointer.startsWith('http')) {
        try {
            const config = getDocumentVaultStorageConfig();
            const presigned = presignAzureBlobRead(config, {
                blobUrl: document.blobPointer,
                contentType: document.mimeType ?? undefined,
            });
            downloadUrl = presigned.downloadUrl;
            expiresAt = presigned.expiresAt;
        } catch {
            downloadUrl = document.blobPointer;
        }
    }

    await requireBreakGlassApproval(deps.breakGlassRepository, {
        authorization: input.authorization,
        approvalId: input.breakGlassApprovalId,
        scope: 'document-vault',
        targetOrgId: tenant.id,
        action: DOCUMENT_VAULT_DOWNLOAD_ACTION,
        resourceId: input.documentId,
        consume: true,
    });

    return {
        downloadUrl,
        expiresAt,
        fileName: document.fileName,
        document,
        scopedAuthorization,
    };
}
