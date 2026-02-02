import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { DocumentVaultFilters, DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import { requireBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/require-break-glass';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { listDocuments } from '@/server/use-cases/records/documents/list-documents';
import { buildTenantScopedAuthorization } from './document-vault-admin-helpers';

export interface ListTenantDocumentsInput {
    authorization: RepositoryAuthorizationContext;
    tenantId: string;
    breakGlassApprovalId: string;
    filters?: DocumentVaultFilters;
}

export interface ListTenantDocumentsDependencies {
    documentVaultRepository: IDocumentVaultRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export interface ListTenantDocumentsResult {
    documents: DocumentVaultRecord[];
    scopedAuthorization: RepositoryAuthorizationContext;
}

export async function listTenantDocuments(
    deps: ListTenantDocumentsDependencies,
    input: ListTenantDocumentsInput,
): Promise<ListTenantDocumentsResult> {
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
        action: 'document-vault.list',
        resourceId: tenant.id,
    });

    const result = await listDocuments(
        { documentVaultRepository: deps.documentVaultRepository },
        { authorization: scopedAuthorization, filters: input.filters },
    );

    await requireBreakGlassApproval(deps.breakGlassRepository, {
        authorization: input.authorization,
        approvalId: input.breakGlassApprovalId,
        scope: 'document-vault',
        targetOrgId: tenant.id,
        action: 'document-vault.list',
        resourceId: tenant.id,
        consume: true,
    });

    return { documents: result.documents, scopedAuthorization };
}
