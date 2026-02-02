import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { enforcePermission } from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { DocumentVaultFilters, DocumentVaultRecord } from '@/server/types/records/document-vault';
import { buildAdminRateLimitKey, checkAdminRateLimit } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';
import {
    buildDocumentVaultAdminDependencies,
    type DocumentVaultAdminDependencyOptions,
    type DocumentVaultAdminDependencies,
} from '@/server/repositories/providers/platform/admin/document-vault-service-dependencies';
import { listTenantDocuments } from '@/server/use-cases/platform/admin/documents/list-tenant-documents';
import {
    presignTenantDocumentDownload,
    type PresignTenantDocumentDownloadResult,
} from '@/server/use-cases/platform/admin/documents/presign-tenant-document-download';

export interface DocumentVaultAdminServiceContract {
    listTenantDocuments(
        authorization: RepositoryAuthorizationContext,
        tenantId: string,
        breakGlassApprovalId: string,
        filters?: DocumentVaultFilters,
    ): Promise<DocumentVaultRecord[]>;
    presignTenantDocumentDownload(
        authorization: RepositoryAuthorizationContext,
        input: {
            tenantId: string;
            documentId: string;
            breakGlassApprovalId: string;
        },
    ): Promise<Pick<PresignTenantDocumentDownloadResult, 'downloadUrl' | 'expiresAt' | 'fileName'>>;
}

export class DocumentVaultAdminService extends AbstractBaseService implements DocumentVaultAdminServiceContract {
    constructor(private readonly deps: DocumentVaultAdminDependencies) {
        super();
    }

    async listTenantDocuments(
        authorization: RepositoryAuthorizationContext,
        tenantId: string,
        breakGlassApprovalId: string,
        filters?: DocumentVaultFilters,
    ): Promise<DocumentVaultRecord[]> {
        const context = this.buildContext(authorization, { metadata: { tenantId } });

        return this.runGuardedOperation(context, 'platform.admin.document-vault.list', {
            guard: () => enforcePermission(authorization, 'platformDocuments', 'read'),
            handler: () => listTenantDocuments(this.deps, { authorization, tenantId, breakGlassApprovalId, filters }),
            audit: async (result) => {
                const auditContext = this.buildContext(result.scopedAuthorization, { metadata: { tenantId } });
                await this.auditAccess(auditContext, {
                    action: 'records.document.list',
                    resourceType: 'records.document',
                    payload: {
                        tenantId,
                        count: result.documents.length,
                    },
                });
            },
        }).then((result) => result.documents);
    }

    async presignTenantDocumentDownload(
        authorization: RepositoryAuthorizationContext,
        input: {
            tenantId: string;
            documentId: string;
            breakGlassApprovalId: string;
        },
    ): Promise<Pick<PresignTenantDocumentDownloadResult, 'downloadUrl' | 'expiresAt' | 'fileName'>> {
        const context = this.buildContext(authorization, {
            metadata: {
                tenantId: input.tenantId,
                documentId: input.documentId,
            },
        });

        return this.runGuardedOperation(context, 'platform.admin.document-vault.download', {
            guard: () => {
                enforcePermission(authorization, 'platformDocuments', 'download');
                const rate = checkAdminRateLimit(
                    buildAdminRateLimitKey({
                        orgId: authorization.orgId,
                        userId: authorization.userId,
                        action: 'document-vault:download',
                    }),
                    5 * 60 * 1000,
                    30,
                );

                if (!rate.allowed) {
                    throw new ValidationError('Rate limit exceeded for document downloads.');
                }
            },
            handler: () => presignTenantDocumentDownload(this.deps, { authorization, ...input }),
            audit: async (result) => {
                const auditContext = this.buildContext(result.scopedAuthorization, {
                    metadata: { tenantId: input.tenantId, documentId: input.documentId },
                });
                await this.auditAccess(auditContext, {
                    action: 'records.document.download',
                    resourceType: 'records.document',
                    resourceId: result.document.id,
                    payload: {
                        tenantId: input.tenantId,
                        fileName: result.document.fileName,
                        type: result.document.type,
                        classification: result.document.classification,
                    },
                });
            },
        }).then((result) => ({
            downloadUrl: result.downloadUrl,
            expiresAt: result.expiresAt,
            fileName: result.fileName,
        }));
    }

    private buildContext(
        authorization: RepositoryAuthorizationContext,
        options?: Omit<ServiceExecutionContext, 'authorization'>,
    ): ServiceExecutionContext {
        return {
            authorization,
            correlationId: options?.correlationId ?? authorization.correlationId,
            metadata: options?.metadata,
        };
    }
}

const sharedDependencies = buildDocumentVaultAdminDependencies();
const sharedService = new DocumentVaultAdminService(sharedDependencies);

function resolveDependencies(
    overrides?: Partial<DocumentVaultAdminDependencies>,
    options?: DocumentVaultAdminDependencyOptions,
): DocumentVaultAdminDependencies {
    if (!overrides && !options) {
        return sharedDependencies;
    }

    return buildDocumentVaultAdminDependencies({
        prismaOptions: options?.prismaOptions,
        overrides,
    });
}

export function getDocumentVaultAdminService(
    overrides?: Partial<DocumentVaultAdminDependencies>,
    options?: DocumentVaultAdminDependencyOptions,
): DocumentVaultAdminService {
    if (!overrides && !options) {
        return sharedService;
    }
    return new DocumentVaultAdminService(resolveDependencies(overrides, options));
}

export async function listTenantDocumentsService(
    authorization: RepositoryAuthorizationContext,
    tenantId: string,
    breakGlassApprovalId: string,
    filters?: DocumentVaultFilters,
    overrides?: Partial<DocumentVaultAdminDependencies>,
    options?: DocumentVaultAdminDependencyOptions,
): Promise<DocumentVaultRecord[]> {
    return getDocumentVaultAdminService(overrides, options).listTenantDocuments(
        authorization,
        tenantId,
        breakGlassApprovalId,
        filters,
    );
}

export async function presignTenantDocumentDownloadService(
    authorization: RepositoryAuthorizationContext,
    input: {
        tenantId: string;
        documentId: string;
        breakGlassApprovalId: string;
    },
    overrides?: Partial<DocumentVaultAdminDependencies>,
    options?: DocumentVaultAdminDependencyOptions,
): Promise<Pick<PresignTenantDocumentDownloadResult, 'downloadUrl' | 'expiresAt' | 'fileName'>> {
    return getDocumentVaultAdminService(overrides, options).presignTenantDocumentDownload(authorization, input);
}
